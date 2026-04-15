import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TeamMemberDTO {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  status: boolean;
  joinedDate: string;
}

export interface TeamMemberLightDTO {
  id: number;
  name: string;
  department: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class TeamMemberService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/admin/team-members';
  private readonly apiBaseUrl = 'http://localhost:8080/team-members';

  getAll(page = 0, size = 100): Observable<PageResponse<TeamMemberDTO>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<TeamMemberDTO>>(this.baseUrl, { params });
  }

  getLight(): Observable<TeamMemberLightDTO[]> {
    return this.http.get<TeamMemberLightDTO[]>(`${this.apiBaseUrl}/light`);
  }
}
