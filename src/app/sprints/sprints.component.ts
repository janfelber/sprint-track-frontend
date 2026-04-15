import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SprintDTO, SprintService } from '../core/services/sprint.service';

@Component({
  selector: 'app-sprints',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sprints.component.html',
})
export class SprintsComponent implements OnInit {
  private router = inject(Router);
  private readonly sprintService = inject(SprintService);

  sprints = signal<SprintDTO[]>([]);
  loading = signal(true);
  syncing = signal(false);
  lastSynced = signal<string | null>(null);

  ngOnInit(): void {
    this.sprintService.getAll().subscribe({
      next: page => {
        this.sprints.set(page.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  sync(): void {
    this.syncing.set(true);
    setTimeout(() => {
      this.syncing.set(false);
      const now = new Date();
      this.lastSynced.set(now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' }));
    }, 1500);
  }

  openSprint(id: number): void {
    this.router.navigate(['/sprints', id]);
  }

  getStatusClasses(status: string): string {
    const map: Record<string, string> = {
      ACTIVE:    'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      COMPLETED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      PLANNED:   'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    };
    return map[status] ?? '';
  }
}
