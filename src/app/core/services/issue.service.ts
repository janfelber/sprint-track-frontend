import {inject, Injectable} from "@angular/core";
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";

export interface IssueDTO {
    id: number;
    title: string;
    issueKey: string;
    issueType: string;
    sprint: string;
    status: string;
    assignee: string;
    storyPoints: number;
    timeEstimated: number;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export interface AssignedIssueDTO {
    id: number;
    issueKey: string;
    title: string;
    issueType: string;
    status: string;
    storyPoints: number;
}

@Injectable({ providedIn: 'root' })
export class IssueService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = 'http://localhost:8080/admin/all-issues';
    private readonly issueUrl = 'http://localhost:8080/issue';

    getAll(page = 0, size = 100): Observable<PageResponse<IssueDTO>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<PageResponse<IssueDTO>>(this.baseUrl, { params });
    }

    getAssignedToMember(employeeId: number): Observable<AssignedIssueDTO[]> {
        return this.http.get<AssignedIssueDTO[]>(`${this.issueUrl}/${employeeId}`);
    }
}