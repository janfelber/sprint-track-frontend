import {inject, Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {AttendanceStatus, WorklogEntry} from "../../my-attendance/my-attendance.component";

export interface AttendanceDTO {
    id: number;
    sprintId: number;
    checkInTime: string;
    status: AttendanceStatus;
    note: string;
    date: string;
    worklogs: WorklogEntry[];
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = 'http://localhost:8080/attendance';

    getByEmployeeId(employeeId: number): Observable<AttendanceDTO[]> {
        return this.http.get<AttendanceDTO[]>(`${this.baseUrl}/${employeeId}`);
    }

    create(record: Omit<AttendanceDTO, 'id'>): Observable<AttendanceDTO> {
        return this.http.post<AttendanceDTO>(this.baseUrl, record);
    }

    update(id: number, record: {
        sprintId: number;
        date: string;
        status: "PRESENT" | "ABSENT" | "LATE" | "REMOTE" | "SICK_LEAVE" | "VACATION" | "HALF_DAY";
        checkInTime: null | string;
        note: string | null;
        worklogs: WorklogEntry[]
    }): Observable<AttendanceDTO> {
        return this.http.put<AttendanceDTO>(`${this.baseUrl}/${id}`, record);
    }
}