import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'sprint-track-theme';

  isDark = signal<boolean>(this.loadTheme());

  constructor() {
    this.apply();
  }

  toggle(): void {
    this.isDark.update(v => !v);
    this.apply();
  }

  private loadTheme(): boolean {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private apply(): void {
    document.documentElement.classList.toggle('dark', this.isDark());
    localStorage.setItem(this.storageKey, this.isDark() ? 'dark' : 'light');
  }
}
