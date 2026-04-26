import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, map, switchMap, filter, take, catchError, throwError } from 'rxjs';
import { User, UserRole } from '../models/user.model';

interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
}

const TOKEN_KEY = 'access_token';
const USER_KEY = 'auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _user = signal<User | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly role = computed(() => this._user()?.role ?? null);

  private readonly baseUrl = 'http://localhost:8080/auth';

  private isRefreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  login(email: string, password: string): Observable<void> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, { email, password }, { withCredentials: true }).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.accessToken);
        const user: User = {
          id: res.user.id,
          name: res.user.fullName,
          email: res.user.email,
          role: res.user.role as UserRole,
          initials: this.toInitials(res.user.fullName),
        };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this._user.set(user);
      }),
      map(() => void 0)
    );
  }

  logout(): void {
    this.http.post(`${this.baseUrl}/logout`, {}, { withCredentials: true }).subscribe();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasRole(...roles: UserRole[]): boolean {
    const r = this.role();
    return r !== null && roles.includes(r);
  }

  handleTokenExpiry(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshSubject.next(null);

      return this.http.post<{ accessToken: string }>(`${this.baseUrl}/refresh-token`, {}, { withCredentials: true }).pipe(
        tap(res => localStorage.setItem(TOKEN_KEY, res.accessToken)),
        switchMap(res => {
          this.isRefreshing = false;
          this.refreshSubject.next(res.accessToken);
          return next(req.clone({ headers: req.headers.set('Authorization', `Bearer ${res.accessToken}`) }));
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.logout();
          return throwError(() => err);
        })
      );
    }

    // Iné requesty čakajú kým refresh dobehne
    return this.refreshSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token =>
        next(req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) }))
      )
    );
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private toInitials(fullName: string): string {
    return fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
