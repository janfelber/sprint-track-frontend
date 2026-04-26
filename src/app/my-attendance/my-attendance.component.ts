import {Component, signal, computed, OnInit, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import {AttendanceDTO, AttendanceService} from "../core/services/attendance.service";
import {AssignedIssueDTO, IssueService} from "../core/services/issue.service";
import { AuthService } from '../core/services/auth.service';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'REMOTE' | 'SICK_LEAVE' | 'VACATION' | 'HALF_DAY';

export interface WorklogEntry {
  issueId: number;
  issueKey: string;
  issueTitle: string;
  hours: number;
}


@Component({
  selector: 'app-my-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-attendance.component.html',
})
export class MyAttendanceComponent implements OnInit{

  private readonly attendanceService = inject(AttendanceService);
  private readonly issueService = inject(IssueService);
  private readonly auth = inject(AuthService);

  myIssues = signal<AssignedIssueDTO[]>([]);

  // ── Calendar navigation ──────────────────────────────────────────────────
  calendarYear  = signal(new Date().getFullYear());
  calendarMonth = signal(new Date().getMonth());

  allRecords = signal<AttendanceDTO[]>([]);
  loading = signal(false);

  prevMonth(): void {
    if (this.calendarMonth() === 0) {
      this.calendarMonth.set(11);
      this.calendarYear.update(y => y - 1);
    } else {
      this.calendarMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.calendarMonth() === 11) {
      this.calendarMonth.set(0);
      this.calendarYear.update(y => y + 1);
    } else {
      this.calendarMonth.update(m => m + 1);
    }
  }

  monthLabel = computed(() => {
    return new Date(this.calendarYear(), this.calendarMonth(), 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  // Calendar grid: array of day objects (null = padding day)
  calendarDays = computed(() => {
    const year  = this.calendarYear();
    const month = this.calendarMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Start week on Monday: shift Sunday(0) to 6
    const startOffset = (firstDay + 6) % 7;

    const days: (string | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push(dateStr);
    }
    // Pad to full weeks
    while (days.length % 7 !== 0) days.push(null);
    return days;
  });

  isWeekend(dateStr: string): boolean {
    const day = new Date(dateStr).getDay();
    return day === 0 || day === 6;
  }

  ngOnInit(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    this.loading.set(true);
    this.attendanceService.getByEmployeeId(userId).subscribe({
      next: records => { this.allRecords.set(records); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
    this.issueService.getAssignedToMember(userId).subscribe(issues => this.myIssues.set(issues));
  }

  recordByDate(dateStr: string): AttendanceDTO | undefined {
    return this.allRecords().find(r => r.date.substring(0, 10) === dateStr);
  }

  totalHours(record: AttendanceDTO): number {
    return record.worklogs?.reduce((s, w) => s + w.hours, 0) ?? 0;
  }

  monthStats = computed(() => {
    const year  = this.calendarYear();
    const month = this.calendarMonth();
    const recs  = this.allRecords().filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      present:    recs.filter(r => r.status === 'PRESENT').length,
      remote:     recs.filter(r => r.status === 'REMOTE').length,
      late:       recs.filter(r => r.status === 'LATE').length,
      halfDay:    recs.filter(r => r.status === 'HALF_DAY').length,
      absent:     recs.filter(r => r.status === 'ABSENT').length,
      sickLeave:  recs.filter(r => r.status === 'SICK_LEAVE').length,
      vacation:   recs.filter(r => r.status === 'VACATION').length,
      totalHours: Math.round(recs.reduce((s, r) => s + this.totalHours(r), 0) * 10) / 10,
    };
  });

  // ── Modal ─────────────────────────────────────────────────────────────────
  showModal   = signal(false);
  modalDate   = signal('');
  modalStatus = signal<AttendanceStatus>('PRESENT');
  modalCheckIn  = signal('08:00');
  modalCheckOut = signal('16:00');
  modalNote   = signal('');
  modalWorklogs = signal<{ issueId: number; hours: number }[]>([{ issueId: 0, hours: 0 }]);

  openModal(dateStr: string): void {
    if (!dateStr) return;
    this.modalDate.set(dateStr);
    const existing = this.recordByDate(dateStr);
    if (existing) {
      this.modalStatus.set(existing.status);
      this.modalCheckIn.set(existing.checkInTime ? existing.checkInTime.substring(0, 5) : '08:00');
      this.modalNote.set(existing.note ?? '');

      // Merge worklog issues that may not be in the active sprint into myIssues
      if (existing.worklogs && existing.worklogs.length > 0) {
        const currentIds = new Set(this.myIssues().map(i => i.id));
        const missing = existing.worklogs
          .filter(w => !currentIds.has(w.issueId))
          .map(w => ({ id: w.issueId, issueKey: w.issueKey, title: w.issueTitle } as AssignedIssueDTO));
        if (missing.length > 0) {
          this.myIssues.update(issues => [...issues, ...missing]);
        }
        this.modalWorklogs.set(existing.worklogs.map(w => ({ issueId: w.issueId, hours: Number(w.hours) })));
      } else {
        this.modalWorklogs.set([{ issueId: 0, hours: 0 }]);
      }
    } else {
      this.modalStatus.set('PRESENT');
      this.modalCheckIn.set('08:00');
      this.modalCheckOut.set('16:00');
      this.modalNote.set('');
      this.modalWorklogs.set([{ issueId: 0, hours: 0 }]);
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  addWorklogRow(): void {
    this.modalWorklogs.update(rows => [...rows, { issueId: 0, hours: 0 }]);
  }

  removeWorklogRow(index: number): void {
    this.modalWorklogs.update(rows => rows.filter((_, i) => i !== index));
  }

  updateWorklogIssue(index: number, issueId: number): void {
    this.modalWorklogs.update(rows => rows.map((r, i) => i === index ? { ...r, issueId: +issueId } : r));
  }

  updateWorklogHours(index: number, hours: number): void {
    this.modalWorklogs.update(rows => rows.map((r, i) => i === index ? { ...r, hours: +hours } : r));
  }

  saving = signal(false);

  saveModal(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const worklogs = this.modalWorklogs()
      .filter(w => w.issueId > 0 && w.hours > 0)
      .map(w => ({ issueId: w.issueId, hoursSpend: w.hours }));

    const existing = this.recordByDate(this.modalDate());
    const payload = {
      employeeId: userId,
      date: this.modalDate(),
      status: this.modalStatus(),
      checkInTime: this.noTimeStatus ? null : this.modalCheckIn() + ':00',
      note: this.modalNote() || null,
      worklogs,
    };

    this.saving.set(true);

    const request$ = existing
      ? this.attendanceService.update(existing.id, payload)
      : this.attendanceService.create(payload);

    request$.subscribe({
      next: saved => {
        this.allRecords.update(records => {
          const filtered = records.filter(r => r.date.substring(0, 10) !== saved.date.substring(0, 10));
          return [...filtered, saved];
        });
        this.saving.set(false);
        this.closeModal();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  deleteRecord(): void {
    this.allRecords.update(records => records.filter(r => r.date !== this.modalDate()));
    this.closeModal();
  }

  exportXlsx(): void {
    const year  = this.calendarYear();
    const month = this.calendarMonth();
    const recs  = this.allRecords().filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).sort((a, b) => a.date.localeCompare(b.date));

    const monthStr = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(' ', '-');
    const wb = XLSX.utils.book_new();

    // Sheet 1 — Attendance
    const attendanceRows = recs.map(r => ({
      Date: r.date.substring(0, 10),
      Status: r.status,
      'Check-in': r.checkInTime ? r.checkInTime.substring(0, 5) : '',
      'Hours Logged': this.totalHours(r),
      Note: r.note ?? '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attendanceRows), 'Attendance');

    // Sheet 2 — Worklogs
    const worklogRows = recs.flatMap(r =>
      (r.worklogs ?? []).map(w => ({
        Date: r.date.substring(0, 10),
        Issue: w.issueKey,
        Title: w.issueTitle,
        Hours: w.hours,
      }))
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(worklogRows), 'Worklogs');

    XLSX.writeFile(wb, `my-attendance-${monthStr}.xlsx`);
  }

  get noTimeStatus(): boolean {
    return ['ABSENT', 'SICK_LEAVE', 'VACATION'].includes(this.modalStatus());
  }

  // ── Styling helpers ───────────────────────────────────────────────────────
  getDayBg(dateStr: string): string {
    const r = this.recordByDate(dateStr);
    if (!r) return '';
    const map: Record<AttendanceStatus, string> = {
      PRESENT:    'bg-emerald-500/20 border-emerald-500/40',
      REMOTE:     'bg-indigo-500/20 border-indigo-500/40',
      LATE:       'bg-amber-500/20 border-amber-500/40',
      HALF_DAY:   'bg-teal-500/20 border-teal-500/40',
      ABSENT:     'bg-red-500/20 border-red-500/40',
      SICK_LEAVE: 'bg-pink-500/20 border-pink-500/40',
      VACATION:   'bg-purple-500/20 border-purple-500/40',
    };
    return map[r.status];
  }

  getStatusDot(status: AttendanceStatus): string {
    const map: Record<AttendanceStatus, string> = {
      PRESENT: 'bg-emerald-400', REMOTE: 'bg-indigo-400', LATE: 'bg-amber-400',
      HALF_DAY: 'bg-teal-400', ABSENT: 'bg-red-400', SICK_LEAVE: 'bg-pink-400', VACATION: 'bg-purple-400',
    };
    return map[status];
  }

  getStatusLabel(status: AttendanceStatus): string {
    const map: Record<AttendanceStatus, string> = {
      PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late',
      REMOTE: 'Remote', SICK_LEAVE: 'Sick Leave', VACATION: 'Vacation', HALF_DAY: 'Half Day',
    };
    return map[status];
  }

  getStatusBadge(status: AttendanceStatus): string {
    const map: Record<AttendanceStatus, string> = {
      PRESENT:    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      ABSENT:     'bg-red-500/15 text-red-400 border border-red-500/30',
      LATE:       'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      REMOTE:     'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
      SICK_LEAVE: 'bg-pink-500/15 text-pink-400 border border-pink-500/30',
      VACATION:   'bg-purple-500/15 text-purple-400 border border-purple-500/30',
      HALF_DAY:   'bg-teal-500/15 text-teal-400 border border-teal-500/30',
    };
    return map[status];
  }

  formatModalDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
}
