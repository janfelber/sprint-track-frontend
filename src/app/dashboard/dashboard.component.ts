import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import {
  AssignedIssue,
  DashboardData,
  DashboardService,
  EmployeeDashboardData,
} from '../core/services/dashboard.service';
import { AttendanceService } from '../core/services/attendance.service';

interface StatCard {
  label: string;
  value: number;
  change: string;
  changeType: 'up' | 'down' | 'neutral';
  iconBg: string;
  iconColor: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private attendanceService = inject(AttendanceService);

  data = signal<DashboardData | null>(null);
  employeeData = signal<EmployeeDashboardData | null>(null);

  currentUser = this.auth.user;
  role = this.auth.role;

  ngOnInit(): void {
    if (this.role() === 'EMPLOYEE') {
      const userId = this.auth.user()?.id;
      if (userId) {
        this.dashboardService.getEmployeeDashboardData(userId).subscribe({
          next: data => this.employeeData.set(data),
          error: err => console.error('Employee dashboard error:', err),
        });
      }
    } else {
      this.dashboardService.getDashboardData().subscribe({
        next: data => this.data.set(data),
        error: err => console.error('Dashboard HTTP error:', err),
      });
    }
  }

  activeSprint = computed(() =>
    this.role() === 'EMPLOYEE' ? this.employeeData()?.activeSprint : this.data()?.activeSprint,
  );

  today = computed(() =>
    this.role() === 'EMPLOYEE' ? this.employeeData()?.today : this.data()?.today,
  );

  sprintProgressPct = computed(() => {
    const s = this.activeSprint();
    if (!s || s.totalDays === 0) return 0;
    return Math.round((s.currentDay / s.totalDays) * 100);
  });

  daysRemaining = computed(() => {
    const s = this.activeSprint();
    if (!s) return 0;
    return s.totalDays - s.currentDay;
  });

  private avgAttendanceDeltaText = computed(() => {
    const delta = this.data()?.avgAttendanceDelta;
    if (delta == null) return 'No previous sprint data';
    const abs = Math.abs(delta).toFixed(1);
    return `${delta >= 0 ? '↑' : '↓'} ${abs}% from last sprint`;
  });

  private lateCheckInText = computed(() => {
    const lateMembers = this.data()?.todayAttendance?.filter(m => m.status === 'LATE');
    if (!lateMembers?.length) return '—';
    const checkIn = lateMembers[0].checkInTime;
    return checkIn ? `↓ checked in ${checkIn.slice(0, 5)}` : '—';
  });

  stats = computed<StatCard[]>(() => [
    {
      label: 'Total Members',
      value: this.data()?.totalMembers ?? 0,
      change: 'This sprint',
      changeType: 'neutral',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      icon: 'users',
    },
    {
      label: 'Avg Attendance',
      value: Math.round(this.data()?.avgAttendance ?? 0),
      change: this.avgAttendanceDeltaText(),
      changeType: (this.data()?.avgAttendanceDelta ?? 0) >= 0 ? 'up' : 'down',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-500',
      icon: 'check-circle',
    },
    {
      label: 'Absent Today',
      value: this.data()?.absentToday ?? 0,
      change: `${this.data()?.todaySummary?.vacation ?? 0} on vacation`,
      changeType: 'neutral',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      icon: 'user-x',
    },
    {
      label: 'Late Today',
      value: this.data()?.lateToday ?? 0,
      change: this.lateCheckInText(),
      changeType: 'down',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      icon: 'clock',
    },
  ]);

  teamMembers = computed(() => {
    const d = this.data()?.todayAttendance;
    if (!d) return [];
    return d.map(m => ({
      initials: this.getInitials(m.name),
      name: m.name,
      role: m.role,
      status: m.status.toLowerCase(),
      checkInTime: m.checkInTime,
      note: m.note,
      color: this.getStatusColor(m.status),
    }));
  });

  myIssues = computed(() => this.employeeData()?.myIssues ?? []);

  mySprintAttendance = computed(() =>
    (this.employeeData()?.mySprintAttendance ?? []).map(d => ({
      ...d,
      status: d.status.toLowerCase(),
    })),
  );

  myTodayStatus = computed(() =>
    this.employeeData()?.myTodayStatus?.toLowerCase() ?? null,
  );

  myCheckInTime = computed(() =>
    this.employeeData()?.myCheckInTime?.slice(0, 5) ?? null,
  );

  get myDoneCount(): number {
    return this.myIssues().filter(i => i.status === 'DONE').length;
  }

  sprintTrend = computed(() => this.data()?.sprintTrend ?? []);

  get maxSprintPct(): number {
    const trend = this.sprintTrend();
    if (!trend.length) return 100;
    return Math.max(...trend.map(t => t.pct));
  }

  getBarHeight(pct: number): string {
    return `${Math.round((pct / this.maxSprintPct) * 110)}px`;
  }

  weeklyBreakdown = computed(() => this.data()?.weeklyBreakdown ?? []);

  todaySummaryCards = computed(() => {
    const d = this.data()?.todaySummary;
    if (!d) return [];
    return [
      { label: 'Present', count: d.present, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
      { label: 'Remote', count: d.remote, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
      { label: 'Late', count: d.late, color: 'bg-amber-400', textColor: 'text-amber-600' },
      { label: 'Absent', count: d.absent, color: 'bg-red-500', textColor: 'text-red-600' },
      { label: 'Sick Leave', count: d.sickLeave, color: 'bg-pink-500', textColor: 'text-pink-600' },
    ];
  });

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  private getStatusColor(status: string): string {
    const map: Record<string, string> = {
      PRESENT: 'bg-emerald-500',
      REMOTE: 'bg-indigo-500',
      LATE: 'bg-amber-500',
      ABSENT: 'bg-red-500',
      SICK_LEAVE: 'bg-pink-500',
    };
    return map[status] ?? 'bg-gray-400';
  }

  getRoleBadgeClasses(role: string | null): string {
    const map: Record<string, string> = {
      ADMIN: 'bg-purple-500/20 text-purple-400',
      SCRUM_MASTER: 'bg-blue-500/20 text-blue-400',
      EMPLOYEE: 'bg-emerald-500/20 text-emerald-400',
    };
    return map[role ?? ''] ?? 'bg-gray-500/20 text-gray-400';
  }

  formatRole(role: string | null): string {
    const map: Record<string, string> = {
      ADMIN: 'Admin',
      SCRUM_MASTER: 'Scrum Master',
      EMPLOYEE: 'Employee',
    };
    return map[role ?? ''] ?? role ?? '';
  }

  getStatusClasses(status: string): string {
    const map: Record<string, string> = {
      present: 'bg-emerald-100 text-emerald-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-amber-100 text-amber-800',
      remote: 'bg-indigo-100 text-indigo-800',
      sick_leave: 'bg-pink-100 text-pink-800',
      vacation: 'bg-purple-100 text-purple-800',
      half_day: 'bg-teal-100 text-teal-800',
    };
    return map[status] ?? 'bg-gray-100 text-gray-800';
  }

  getStatusDotColor(status: string): string {
    const map: Record<string, string> = {
      present: 'bg-emerald-500',
      absent: 'bg-red-500',
      late: 'bg-amber-400',
      remote: 'bg-indigo-500',
      sick_leave: 'bg-pink-500',
      vacation: 'bg-purple-500',
      half_day: 'bg-teal-500',
    };
    return map[status] ?? 'bg-gray-400';
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getIssueStatusClasses(status: string): string {
    const map: Record<string, string> = {
      TO_DO: 'bg-gray-100 text-gray-600',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      IN_REVIEW: 'bg-amber-100 text-amber-700',
      DONE: 'bg-emerald-100 text-emerald-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }

  getIssueTypeClasses(type: string): string {
    const map: Record<string, string> = {
      STORY: 'bg-purple-100 text-purple-700',
      TASK: 'bg-blue-100 text-blue-700',
      BUG: 'bg-red-100 text-red-700',
      SUBTASK: 'bg-gray-100 text-gray-600',
    };
    return map[type] ?? 'bg-gray-100 text-gray-600';
  }

  formatIssueStatus(status: string): string {
    const map: Record<string, string> = {
      TO_DO: 'To Do',
      IN_PROGRESS: 'In Progress',
      IN_REVIEW: 'In Review',
      DONE: 'Done',
    };
    return map[status] ?? status;
  }

  get firstName(): string {
    return this.currentUser()?.name?.split(' ')[0] ?? '';
  }

  get isWeekend(): boolean {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  }

  onCheckIn(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const now = new Date();
    const date = now.toISOString().substring(0, 10);
    const checkInTime = now.toTimeString().substring(0, 8); // HH:mm:ss

    this.attendanceService.create({
      employeeId: userId,
      date,
      status: 'PRESENT',
      checkInTime,
      note: null,
      worklogs: [],
    }).subscribe({
      next: () => {
        this.dashboardService.getEmployeeDashboardData(userId).subscribe(data => this.employeeData.set(data));
      },
      error: err => console.error('Check-in failed', err),
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
