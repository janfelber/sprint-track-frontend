import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../models/user.model';

interface MockUser extends User {
  password: string;
}

const MOCK_USERS: MockUser[] = [
  {
    id: 99,
    name: 'Admin',
    email: 'admin@sprinttrack.com',
    password: 'admin123',
    role: 'ADMIN',
    initials: 'AD',
  },
  {
    id: 10,
    name: 'Katarína Simonová',
    email: 'sm@sprinttrack.com',
    password: 'sm123',
    role: 'SCRUM_MASTER',
    initials: 'KS',
  },
  {
    id: 1,
    name: 'Jan Novák',
    email: 'jan@sprinttrack.com',
    password: 'emp123',
    role: 'EMPLOYEE',
    initials: 'JN',
  },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  private _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly role = computed(() => this._user()?.role ?? null);

  login(email: string, password: string): boolean {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (!found) return false;
    const { password: _, ...user } = found;
    this._user.set(user);
    return true;
  }

  logout(): void {
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  hasRole(...roles: UserRole[]): boolean {
    const r = this.role();
    return r !== null && roles.includes(r);
  }
}
