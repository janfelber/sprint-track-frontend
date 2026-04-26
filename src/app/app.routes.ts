import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard, adminGuard, managerGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'attendance',
        loadComponent: () => import('./my-attendance/my-attendance.component').then(m => m.MyAttendanceComponent),
      },
      {
        path: 'sprints',
        loadComponent: () => import('./sprints/sprints.component').then(m => m.SprintsComponent),
      },
      {
        path: 'sprints/:id',
        loadComponent: () => import('./sprints/sprint-detail.component').then(m => m.SprintDetailComponent),
      },
      {
        path: 'team-attendance',
        loadComponent: () => import('./team-attendance/team-attendance.component').then(m => m.TeamAttendanceComponent),
        canActivate: [managerGuard],
      },
      {
        path: 'issues',
        loadComponent: () => import('./issues/issues.component').then(m => m.IssuesComponent),
      },
      {
        path: 'velocity',
        loadComponent: () => import('./analytics/velocity.component').then(m => m.VelocityComponent),
      },
      {
        path: 'workload',
        loadComponent: () => import('./analytics/workload.component').then(m => m.WorkloadComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./analytics/reports.component').then(m => m.ReportsComponent),
      },
      {
        path: 'admin/team',
        loadComponent: () => import('./admin/admin-team.component').then(m => m.AdminTeamComponent),
        canActivate: [adminGuard],
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
