import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse } from './issue.service';

export interface SprintDTO {
  id: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: string;
  issueCount: number;
  doneCount: number;
}

export interface IssueSprintSummary {
  issueKey: string;
  title: string;
  issueType: string;
  status: string;
  assignee: string;
  storyPoints: number;
  estimatedHours: number;
}

export interface SprintDetailDTO {
  id: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: string;
  issues: IssueSprintSummary[];
}

@Injectable({ providedIn: 'root' })
export class SprintService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/sprints';

  getAll(page = 0, size = 50): Observable<PageResponse<SprintDTO>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<SprintDTO>>(`${this.baseUrl}/all`, { params });
  }

  getById(id: number): Observable<SprintDetailDTO> {
    return this.http.get<SprintDetailDTO>(`${this.baseUrl}/${id}`);
  }

  getAllNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/names`);
  }
}
