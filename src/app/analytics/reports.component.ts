import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, SprintReport } from '../core/services/analytics.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  reports = signal<SprintReport[]>([]);
  loading = signal(true);

  completed = computed(() => this.reports().filter(r => r.status === 'COMPLETED'));
  totalDelivered = computed(() => this.reports().reduce((s, r) => s + r.doneSP, 0));
  avgCompletion = computed(() => {
    const c = this.completed();
    return c.length ? Math.round(c.reduce((s, r) => s + r.completionPct, 0) / c.length) : 0;
  });
  totalBugs = computed(() => this.reports().reduce((s, r) => s + r.bugCount, 0));
  totalIssues = computed(() => this.reports().reduce((s, r) => s + r.totalIssues, 0));
  totalStories = computed(() => this.reports().reduce((s, r) => s + r.storyCount, 0));
  totalTasks = computed(() => this.reports().reduce((s, r) => s + r.taskCount, 0));
  typeTotal = computed(() => this.totalBugs() + this.totalStories() + this.totalTasks());

  ngOnInit(): void {
    this.analyticsService.getReports().subscribe({
      next: data => {
        this.reports.set(data);
        this.loading.set(false);
      },
      error: err => {
        console.error('Reports error:', err);
        this.loading.set(false);
      },
    });
  }

  getStatusClasses(status: string): string {
    const map: Record<string, string> = {
      ACTIVE:    'bg-blue-500/20 text-blue-400',
      COMPLETED: 'bg-emerald-500/20 text-emerald-400',
      PLANNED:   'bg-gray-500/20 text-gray-400',
    };
    return map[status] ?? '';
  }

  getCompletionColor(percentage: number): string {
    if (percentage >= 90) return 'text-emerald-400';
    if (percentage >= 70) return 'text-blue-400';
    if (percentage >= 50) return 'text-amber-400';
    return 'text-red-400';
  }

  getCompletionBarColor(percentage: number): string {
    if (percentage >= 90) return 'bg-emerald-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-amber-400';
    return 'bg-red-500';
  }
}
