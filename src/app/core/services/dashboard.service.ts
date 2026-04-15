import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AttendanceStatus } from '../../my-attendance/my-attendance.component';

export interface ActiveSprint {
  name: string;
  startDate: string;
  endDate: string;
  currentDay: number;
  totalDays: number;
}

export interface DashboardStats {
  totalMembers: number;
  avgAttendance: number;
  absentToday: number;
  lateToday: number;
}

export interface TodayAttendanceEntry {
  name: string;
  role: string;
  status: AttendanceStatus;
  checkInTime: string | null;
  note: string | null;
}

export interface TodaySummary {
  present: number;
  remote: number;
  late: number;
  absent: number;
  sickLeave: number;
  vacation: number;
  halfDay: number;
}

export interface WeeklyBreakdownEntry {
  day: string;
  present: number;
  remote: number;
  late: number;
  absent: number;
  total: number;
}

export interface SprintTrend {
  sprint: string;
  pct: number;
  active: boolean;
}

export interface DashboardData {
  totalMembers: number;
  avgAttendance: number;
  absentToday: number;
  lateToday: number;
  todayAttendance: TodayAttendanceEntry[];
  todaySummary: TodaySummary;
  weeklyBreakdown: WeeklyBreakdownEntry[];
  sprintTrend: SprintTrend[];
  activeSprint: ActiveSprint | null;
  avgAttendanceDelta: number | null;
  today: string;
}

export interface AssignedIssue {
  id: number;
  issueKey: string;
  title: string;
  issueType: 'STORY' | 'TASK' | 'BUG' | 'SUBTASK';
  status: 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  storyPoints: number;
}

export interface MyAttendanceDay {
  date: string;
  status: AttendanceStatus;
  checkInTime: string | null;
}

export interface EmployeeDashboardData {
  activeSprint: ActiveSprint | null;
  myTodayStatus: AttendanceStatus | null;
  myCheckInTime: string | null;
  myIssues: AssignedIssue[];
  mySprintAttendance: MyAttendanceDay[];
  today: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/dashboard';

  getDashboardData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.baseUrl}/statistics/management`);
  }

  getEmployeeDashboardData(employeeId: number): Observable<EmployeeDashboardData> {
    return this.http.get<EmployeeDashboardData>(`${this.baseUrl}/statistics/employee/${employeeId}`);
  }
}
