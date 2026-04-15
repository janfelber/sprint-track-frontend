import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { IssueService, IssueDTO } from '../core/services/issue.service';
import {SprintService} from "../core/services/sprint.service";

@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './issues.component.html',
})
export class IssuesComponent implements OnInit {
  private readonly issueService = inject(IssueService);
  private readonly sprintService = inject(SprintService);

  issues  = signal<IssueDTO[]>([]);
  sprints = signal<string[]>([]);
  loading = signal(true);

  filterSprint = signal<string>('ALL');
  filterStatus = signal<string>('ALL');
  searchQuery  = signal('');

  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.issues().filter(i => {
      const matchSprint = this.filterSprint() === 'ALL' || i.sprint === this.filterSprint();
      const matchStatus = this.filterStatus() === 'ALL' || i.status === this.filterStatus();
      const matchSearch = !q || i.title.toLowerCase().includes(q) || i.issueKey.toLowerCase().includes(q);
      return matchSprint && matchStatus && matchSearch;
    });
  });

  ngOnInit(): void {
    this.loading.set(true);

    this.sprintService.getAllNames().subscribe(names => {
      this.sprints.set(names);
    });

    this.issueService.getAll().subscribe({
      next: page => {
        this.issues.set(page.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getStatusClasses(status: string): string {
    const map: Record<string, string> = {
      TO_DO:       'bg-gray-500/15 text-gray-400 border border-gray-500/25',
      IN_PROGRESS: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
      IN_REVIEW:   'bg-amber-500/15 text-amber-400 border border-amber-500/25',
      DONE:        'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    };
    return map[status] ?? 'bg-gray-500/15 text-gray-400 border border-gray-500/25';
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

  getTypeColor(type: string): string {
    const map: Record<string, string> = {
      BUG:     'text-red-400',
      STORY:   'text-emerald-400',
      TASK:    'text-blue-400',
      SUBTASK: 'text-gray-400',
    };
    return map[type] ?? 'text-gray-400';
  }
}