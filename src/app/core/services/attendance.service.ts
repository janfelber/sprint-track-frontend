import {inject, Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {AttendanceStatus, WorklogEntry} from "../../my-attendance/my-attendance.component";

export interface AttendanceDTO {
    id: number;
    checkInTime: string;
    status: AttendanceStatus;
    note: string;
    date: string;
    worklogs: WorklogEntry[];
}

export interface AttendanceRequest {
    employeeId: number;
    date: string;
    status: AttendanceStatus;
    checkInTime: string | null;
    note: string | null;
    worklogs: { issueId: number; hoursSpend: number }[];
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = 'http://localhost:8080/attendance';

    getByEmployeeId(employeeId: number): Observable<AttendanceDTO[]> {
        return this.http.get<AttendanceDTO[]>(`${this.baseUrl}/${employeeId}`);
    }

    create(record: AttendanceRequest): Observable<AttendanceDTO> {
        return this.http.post<AttendanceDTO>(`${this.baseUrl}/check-in`, record);
    }

    update(id: number, record: AttendanceRequest): Observable<AttendanceDTO> {
        return this.http.put<AttendanceDTO>(`${this.baseUrl}/${id}`, record);
    }
}