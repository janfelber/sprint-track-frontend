import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { SprintDetailDTO, SprintService } from '../core/services/sprint.service';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500',
  'bg-pink-500', 'bg-teal-500', 'bg-rose-500', 'bg-violet-500',
];

@Component({
  selector: 'app-sprint-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './sprint-detail.component.html',
})
export class SprintDetailComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private sprintService = inject(SprintService);

  sprint  = signal<SprintDetailDTO | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.sprintService.getById(id).subscribe({
      next: s => { this.sprint.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  issues     = computed(() => this.sprint()?.issues ?? []);
  done       = computed(() => this.issues().filter(i => i.status === 'DONE').length);
  inProgress = computed(() => this.issues().filter(i => i.status === 'IN_PROGRESS').length);
  inReview   = computed(() => this.issues().filter(i => i.status === 'IN_REVIEW').length);
  toDo       = computed(() => this.issues().filter(i => i.status === 'TO_DO').length);
  totalSP    = computed(() => this.issues().reduce((s, i) => s + i.storyPoints, 0));
  doneSP     = computed(() => this.issues().filter(i => i.status === 'DONE').reduce((s, i) => s + i.storyPoints, 0));
  progress   = computed(() => this.issues().length ? Math.round((this.done() / this.issues().length) * 100) : 0);

  goBack(): void { this.router.navigate(['/sprints']); }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    let hash = 0;
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }

  getStatusClasses(status: string): string {
    const map: Record<string, string> = {
      TO_DO:       'bg-gray-500/15 text-gray-400 border border-gray-500/25',
      IN_PROGRESS: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
      IN_REVIEW:   'bg-amber-500/15 text-amber-400 border border-amber-500/25',
      DONE:        'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    };
    return map[status] ?? 'bg-gray-500/15 text-gray-400';
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = {
      BUG:     'text-red-400',
      STORY:   'text-emerald-400',
      TASK:    'text-blue-400',
      SUBTASK: 'text-gray-400',
    };
    return map[type] ?? 'text-gray-400';
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = {
      BUG:     'bug',
      STORY:   'book-open',
      TASK:    'square-check-big',
      SUBTASK: 'list',
    };
    return map[type] ?? 'file-text';
  }

  getSprintStatusClasses(status: string): string {
    const map: Record<string, string> = {
      ACTIVE:    'bg-blue-500/20 text-blue-400',
      COMPLETED: 'bg-emerald-500/20 text-emerald-400',
      PLANNED:   'bg-gray-500/20 text-gray-400',
    };
    return map[status] ?? '';
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }
}
