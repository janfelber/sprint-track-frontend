import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import {
  LUCIDE_ICONS,
  LucideIconProvider,
  LayoutGrid,
  SquareCheck,
  List,
  Users,
  TrendingUp,
  Monitor,
  FileText,
  Calendar,
  LogOut,
  Bug,
  BookOpen,
  Zap,
  Layers,
  SquareCheckBig,
  Settings,
  ChevronDown,
} from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        LayoutGrid,
        SquareCheck,
        SquareCheckBig,
        List,
        Users,
        TrendingUp,
        Monitor,
        FileText,
        Calendar,
        LogOut,
        Bug,
        BookOpen,
        Zap,
        Layers,
        Settings,
        ChevronDown,
      }),
    },
  ],
};
