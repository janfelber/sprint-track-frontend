import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamMemberService, TeamMemberLightDTO } from '../core/services/team-member.service';
import { AttendanceService, AttendanceDTO } from '../core/services/attendance.service';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'REMOTE' | 'SICK_LEAVE' | 'VACATION' | 'HALF_DAY';

const MEMBER_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500',
  'bg-pink-500', 'bg-teal-500', 'bg-rose-500', 'bg-violet-500',
];

@Component({
  selector: 'app-team-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-attendance.component.html',
})
export class TeamAttendanceComponent {
  private readonly teamMemberService = inject(TeamMemberService);
  private readonly attendanceService = inject(AttendanceService);

  members = signal<TeamMemberLightDTO[]>([]);
  attendanceRecords = signal<AttendanceDTO[]>([]);
  membersLoading = signal(true);
  recordsLoading = signal(false);

  selectedMemberId = signal<number | null>(null);
  selectedMember = computed(() => this.members().find(m => m.id === this.selectedMemberId()) ?? null);

  calendarYear  = signal(2024);
  calendarMonth = signal(4);

  constructor() {
    this.teamMemberService.getLight().subscribe(members => {
      this.members.set(members);
      this.membersLoading.set(false);
      if (members.length > 0) this.selectedMemberId.set(members[0].id);
    });

    effect(() => {
      const id = this.selectedMemberId();
      if (id === null) return;
      this.recordsLoading.set(true);
      this.attendanceRecords.set([]);
      this.attendanceService.getByEmployeeId(id).subscribe(records => {
        this.attendanceRecords.set(records);
        this.recordsLoading.set(false);
      });
    });
  }

  getMemberColor(index: number): string {
    return MEMBER_COLORS[index % MEMBER_COLORS.length];
  }

  getMemberInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  prevMonth(): void {
    if (this.calendarMonth() === 0) { this.calendarMonth.set(11); this.calendarYear.update(y => y - 1); }
    else { this.calendarMonth.update(m => m - 1); }
  }

  nextMonth(): void {
    if (this.calendarMonth() === 11) { this.calendarMonth.set(0); this.calendarYear.update(y => y + 1); }
    else { this.calendarMonth.update(m => m + 1); }
  }

  monthLabel = computed(() =>
    new Date(this.calendarYear(), this.calendarMonth(), 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  calendarDays = computed(() => {
    const year = this.calendarYear(), month = this.calendarMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDay + 6) % 7;
    const days: (string | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  });

  isWeekend(dateStr: string): boolean {
    const day = new Date(dateStr).getDay();
    return day === 0 || day === 6;
  }

  recordByDate(dateStr: string): AttendanceDTO | undefined {
    return this.attendanceRecords().find(r => r.date === dateStr);
  }

  totalHours(record: AttendanceDTO): number {
    const total = record.worklogs?.reduce((s, w) => s + w.hours, 0) ?? 0;
    return Math.round(total * 10) / 10;
  }

  monthStats = computed(() => {
    const year = this.calendarYear(), month = this.calendarMonth();
    const recs = this.attendanceRecords().filter(r => {
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

  expandedDate = signal<string | null>(null);

  toggleDay(dateStr: string): void {
    const rec = this.recordByDate(dateStr);
    if (!rec || !rec.worklogs?.length) return;
    this.expandedDate.update(d => d === dateStr ? null : dateStr);
  }

  getDayBg(dateStr: string): string {
    const r = this.recordByDate(dateStr);
    if (!r) return '';
    const map: Record<string, string> = {
      PRESENT:    'bg-emerald-500/20 border-emerald-500/40',
      REMOTE:     'bg-indigo-500/20 border-indigo-500/40',
      LATE:       'bg-amber-500/20 border-amber-500/40',
      HALF_DAY:   'bg-teal-500/20 border-teal-500/40',
      ABSENT:     'bg-red-500/20 border-red-500/40',
      SICK_LEAVE: 'bg-pink-500/20 border-pink-500/40',
      VACATION:   'bg-purple-500/20 border-purple-500/40',
    };
    return map[r.status] ?? '';
  }

  getStatusDot(status: string): string {
    const map: Record<string, string> = {
      PRESENT: 'bg-emerald-400', REMOTE: 'bg-indigo-400', LATE: 'bg-amber-400',
      HALF_DAY: 'bg-teal-400', ABSENT: 'bg-red-400', SICK_LEAVE: 'bg-pink-400', VACATION: 'bg-purple-400',
    };
    return map[status] ?? 'bg-gray-600';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late',
      REMOTE: 'Remote', SICK_LEAVE: 'Sick Leave', VACATION: 'Vacation', HALF_DAY: 'Half Day',
    };
    return map[status] ?? status;
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      PRESENT:    'text-emerald-400', REMOTE: 'text-indigo-400', LATE: 'text-amber-400',
      HALF_DAY:   'text-teal-400',    ABSENT: 'text-red-400',    SICK_LEAVE: 'text-pink-400',
      VACATION:   'text-purple-400',
    };
    return map[status] ?? 'text-gray-400';
  }
}
