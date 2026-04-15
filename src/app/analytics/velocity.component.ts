import {Component, computed, inject, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import {AnalyticsService, BurndownPoint, Velocity} from "../core/services/analytics.service";

export interface VelocityBar {
  sprintId: number;
  label: string;
  committed: number;
  completed: number;
  active: boolean;
}

@Component({
  selector: 'app-velocity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './velocity.component.html',
})
export class VelocityComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  velocity = signal<Velocity[]>([]);
  burndown = signal<BurndownPoint[]>([]);
  loading = signal(true);

  velocityBars = computed(() =>
      this.velocity().map(v => ({
        sprintId: v.sprintId,
        label: v.label,
        committed: v.committed,
        completed: v.completed,
        active: v.active
      }))
  );

  chartMax = computed(() =>
      Math.max(...this.velocityBars().map(v => v.committed), 0)
  );

  completedSprints = computed(() =>
      this.velocityBars().filter(v => !v.active)
  );

  avgVelocity = computed(() => {
    const s = this.completedSprints();
    return s.length
        ? Math.round(s.reduce((sum, v) => sum + v.completed, 0) / s.length)
        : 0;
  });

  activeSprint = computed(() =>
      this.velocityBars().find(v => v.active)
  );

  highestSprint = computed(() => {
    const s = this.completedSprints();
    return s.length
        ? s.reduce((a, b) => (b.completed > a.completed ? b : a))
        : null;
  });

  trend = computed(() => {
    const s = this.completedSprints();
    if (s.length < 2) return 0;
    return s.at(-1)!.completed - s.at(-2)!.completed;
  });

  ngOnInit(): void {
    this.loading.set(true);

    this.analyticsService.getVelocity().subscribe({
      next: data => {
        this.velocity.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.analyticsService.getBurndown().subscribe({
      next: data => {
        this.burndown.set(data);
      },
      error: () => {},
    });
  }

  // ── Burndown ──────────────────────────────────────────────────────
  readonly svgW = 580;
  readonly svgH = 145;
  readonly pad = { top: 10, left: 32, right: 12, bottom: 20 };
  readonly svgViewBox = `0 0 ${this.svgW} ${this.svgH + this.pad.top + this.pad.bottom}`;

  private formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  todayIndex = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    const data = this.burndown();
    if (!data.length) return 0;
    let idx = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i].date <= today) idx = i;
      else break;
    }
    return idx;
  });

  totalSP = computed(() => {
    const data = this.burndown();
    return data.length ? Math.max(...data.map(d => d.remaining)) : 0;
  });

  idealPoints = computed(() => {
    const data = this.burndown();
    const total = this.totalSP();
    const n = data.length;

    if (!n) return [];

    return data.map((_, i) => ({
      x: this.xOf(i),
      y: this.yOf(total - (total / (n - 1)) * i)
    }));
  });

  points = computed(() =>
      this.burndown().map((d, i) => ({
        x: this.xOf(i),
        y: this.yOf(d.remaining)
      }))
  );

  actualPath = computed(() =>
      this.points()
          .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
          .join(' ')
  );

  idealPath = computed(() =>
      this.idealPoints()
          .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
          .join(' ')
  );

  labelPositions = computed(() =>
    this.burndown().map((d, i) => {
      const label = this.formatDate(d.date);
      return { label, x: this.xOf(i), shortLabel: label.split(' ')[1] };
    })
  );

  yGridLines = computed(() => {
    const total = this.totalSP();
    return [0, 25, 50, 75, 100].map(pct => ({
      y: this.yOf(Math.round((pct / 100) * total)),
      value: Math.round((pct / 100) * total),
    }));
  });

  burndownDateRange = computed(() => {
    const data = this.burndown();
    if (!data.length) return '';
    return `${this.formatDate(data[0].date)} – ${this.formatDate(data[data.length - 1].date)}`;
  });

  getBarHeight(value: number): number {
    return (value / this.chartMax()) * 160;
  }

  private xOf(i: number): number {
    const n = this.burndown().length;

    return this.pad.left +
        (i / (n - 1)) * (this.svgW - this.pad.left - this.pad.right);
  }

  private yOf(value: number): number {
    const max = Math.max(...this.burndown().map(d => d.remaining));

    return this.pad.top + (1 - value / max) * this.svgH;
  }

  areaPath = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';

    const last = pts[pts.length - 1];
    const first = pts[0];
    const bottom = this.pad.top + this.svgH;

    const line = pts
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
        .join(' ');

    return (
        line +
        ` L${last.x},${bottom}` +
        ` L${first.x},${bottom} Z`
    );
  });

}
