import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamMemberService } from '../core/services/team-member.service';

export type SystemRole = 'ADMIN' | 'SCRUM_MASTER' | 'EMPLOYEE';
export type MemberStatus = 'active' | 'inactive';

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: SystemRole;
  status: MemberStatus;
  initials: string;
  color: string;
  joinedDate: string;
  department: string;
}

const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500',
  'bg-pink-500', 'bg-teal-500', 'bg-violet-500', 'bg-red-500',
  'bg-orange-500', 'bg-purple-500',
];

@Component({
  selector: 'app-admin-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-team.component.html',
})
export class AdminTeamComponent implements OnInit {
  private readonly teamMemberService = inject(TeamMemberService);

  searchQuery = signal('');
  filterRole = signal<SystemRole | 'ALL'>('ALL');
  filterStatus = signal<MemberStatus | 'ALL'>('ALL');

  members = signal<TeamMember[]>([]);

  ngOnInit(): void {
    this.teamMemberService.getAll().subscribe(page => {
      this.members.set(page.content.map((dto, index) => ({
        id: dto.id,
        name: dto.name,
        email: dto.email,
        role: dto.role as SystemRole,
        status: dto.status ? 'active' : 'inactive',
        department: dto.department ?? '',
        initials: dto.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
        color: COLORS[index % COLORS.length],
        joinedDate: dto.joinedDate ? dto.joinedDate.split('T')[0] : '',
      })));
    });
  }

  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.members().filter(m => {
      const matchSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.department.toLowerCase().includes(q);
      const matchRole   = this.filterRole()   === 'ALL' || m.role   === this.filterRole();
      const matchStatus = this.filterStatus() === 'ALL' || m.status === this.filterStatus();
      return matchSearch && matchRole && matchStatus;
    });
  });

  totalActive   = computed(() => this.members().filter(m => m.status === 'active').length);
  totalAdmins   = computed(() => this.members().filter(m => m.role === 'ADMIN').length);
  totalSMs      = computed(() => this.members().filter(m => m.role === 'SCRUM_MASTER').length);
  totalEmployees= computed(() => this.members().filter(m => m.role === 'EMPLOYEE').length);

  toggleStatus(id: number): void {
    this.members.update(list =>
      list.map(m => m.id === id ? { ...m, status: m.status === 'active' ? 'inactive' : 'active' } : m)
    );
  }

  changeRole(id: number, role: SystemRole): void {
    this.members.update(list =>
        list.map(m => m.id === id ? {...m, role} : m)
    );
  }

  removeMember(id: number): void {
    this.members.update(list => list.filter(m => m.id !== id));
  }
}
