import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'issues', pathMatch: 'full' },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'issues',
        loadComponent: () => import('./issues/issues.component').then(m => m.IssuesComponent),
      }
    ],
  },
  { path: '**', redirectTo: 'issues' },
];
