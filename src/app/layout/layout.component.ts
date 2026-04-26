import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { SprintService, ActiveSprintDTO } from '../core/services/sprint.service';
import { DashboardService } from '../core/services/dashboard.service';

interface NavItem {
  label: string;
  icon: string;
  active?: boolean;
  badge?: number;
  route: string;
}

interface TeamMember {
  initials: string;
  name: string;
  status: string;
  color: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit {
  private auth = inject(AuthService);
  private theme = inject(ThemeService);
  private sprints = inject(SprintService);
  private dashboard = inject(DashboardService);

  currentUser = this.auth.user;
  role = this.auth.role;
  isDark = this.theme.isDark;

  activeSprint = signal<ActiveSprintDTO | null>(null);
  teamMembers  = signal<TeamMember[]>([]);

  private readonly avatarColors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500',
    'bg-pink-500', 'bg-teal-500', 'bg-violet-500', 'bg-red-500',
    'bg-orange-500', 'bg-cyan-500',
  ];

  ngOnInit(): void {
    this.sprints.getActiveSprint().subscribe(s => this.activeSprint.set(s));

    if (this.role() !== 'EMPLOYEE') {
      this.dashboard.getDashboardData().subscribe(data => {
        const members = data.todayAttendance.map((entry, i) => ({
          initials: this.toInitials(entry.name),
          name:     entry.name,
          status:   entry.status.toLowerCase(),
          color:    this.avatarColors[i % this.avatarColors.length],
        }));
        this.teamMembers.set(members);
      });
    }
  }

  private toInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  toggleTheme(): void { this.theme.toggle(); }

  navMain: NavItem[] = [
    { label: 'Dashboard',        icon: 'grid',         route: '/dashboard' },
    { label: 'Team Attendance',  icon: 'check-square', route: '/team-attendance' },
  ];

  navSM: NavItem[] = [
    { label: 'Dashboard',        icon: 'grid',         route: '/dashboard' },
    { label: 'Team Attendance',  icon: 'check-square', route: '/team-attendance' },
    { label: 'My Attendance',    icon: 'check-square', route: '/attendance' },
  ];

  navAnalytics: NavItem[] = [
    { label: 'Velocity', icon: 'trending-up', route: '/velocity' },
    { label: 'Workload', icon: 'monitor',     route: '/workload' },
    { label: 'Reports',  icon: 'file-text',   route: '/reports' },
  ];

  navSprints: NavItem[] = [
    { label: 'All Sprints', icon: 'calendar', route: '/sprints' },
    { label: 'Issues',      icon: 'list',     route: '/issues' },
  ];

  navEmployee: NavItem[] = [
    { label: 'My Dashboard',  icon: 'grid',         route: '/dashboard' },
    { label: 'My Attendance', icon: 'check-square', route: '/attendance' },
    { label: 'My Issues',     icon: 'list',         route: '/issues' },
  ];

  getStatusDotColor(status: string): string {
    const map: Record<string, string> = {
      present:    'bg-emerald-500',
      absent:     'bg-red-500',
      late:       'bg-amber-400',
      remote:     'bg-indigo-500',
      sick_leave: 'bg-pink-500',
      vacation:   'bg-purple-500',
      half_day:   'bg-teal-500',
    };
    return map[status] ?? 'bg-gray-400';
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getRoleBadgeClasses(role: string | null): string {
    const map: Record<string, string> = {
      ADMIN:        'bg-purple-500/20 text-purple-400',
      SCRUM_MASTER: 'bg-blue-500/20 text-blue-400',
      EMPLOYEE:     'bg-emerald-500/20 text-emerald-400',
    };
    return map[role ?? ''] ?? 'bg-gray-500/20 text-gray-400';
  }

  formatRole(role: string | null): string {
    const map: Record<string, string> = {
      ADMIN:        'Admin',
      SCRUM_MASTER: 'Scrum Master',
      EMPLOYEE:     'Employee',
    };
    return map[role ?? ''] ?? role ?? '';
  }

  logout(): void {
    this.auth.logout();
  }
}
