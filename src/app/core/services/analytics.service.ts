import {inject, Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";


export interface Velocity {
    sprintId: number;
    label: string;
    committed: number;
    completed: number;
    active: boolean;
}

export interface BurndownPoint {
    date: string;
    remaining: number;
}


@Injectable({ providedIn: 'root' })
export class AnalyticsService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = 'http://localhost:8080/analytics';

    getVelocity(): Observable<Velocity[]> {
        return this.http.get<Velocity[]>(`${this.baseUrl}/velocity`);
    }

    getBurndown(): Observable<BurndownPoint[]> {
        return this.http.get<BurndownPoint[]>(`${this.baseUrl}/burndown`);
    }
}