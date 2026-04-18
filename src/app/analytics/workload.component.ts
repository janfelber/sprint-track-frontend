import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService, MemberWorkload, WorkloadData } from '../core/services/analytics.service';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500',
  'bg-pink-500', 'bg-teal-500', 'bg-rose-500', 'bg-violet-500',
];

@Component({
  selector: 'app-workload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workload.component.html',
})
export class WorkloadComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  workloadData = signal<WorkloadData | null>(null);
  loading = signal(true);

  sprintName = computed(() => this.workloadData()?.sprintName ?? '');
  workload = computed(() => this.workloadData()?.members ?? []);
  maxCommitted = computed(() => Math.max(...this.workload().map(m => m.committed), 0));
  totalSP = computed(() => this.workload().reduce((s, m) => s + m.committed, 0));
  avgSP = computed(() => this.workload().length ? Math.round(this.totalSP() / this.workload().length) : 0);
  mostLoaded = computed(() => this.workload()[0] ?? null);
  totalDoneSP = computed(() => this.workload().reduce((s, m) => s + m.completed, 0));
  overallCompletion = computed(() => this.totalSP() ? Math.round((this.totalDoneSP() / this.totalSP()) * 100) : 0);

  ngOnInit(): void {
    this.analyticsService.getWorkload().subscribe({
      next: data => {
        this.workloadData.set(data);
        this.loading.set(false);
      },
      error: err => {
        console.error('Workload error:', err);
        this.loading.set(false);
      },
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  // Deterministic color from name — same name always gets the same color across renders
  getAvatarColor(name: string): string {
    let hash = 0;
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }

  getCompletionClasses(percentage: number): string {
    if (percentage === 100) return 'text-emerald-400';
    if (percentage >= 50)   return 'text-blue-400';
    return 'text-gray-500';
  }
