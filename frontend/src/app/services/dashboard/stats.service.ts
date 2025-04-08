// stats.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProjectContextService } from '../project-context.service';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = environment.apiBaseUrl;

  constructor(
    private http: HttpClient,
    private projectContextService: ProjectContextService
  ) {}

  getTimeStats(userId: string, projectFilter: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/timelogs/user/${userId}/stats${projectFilter}`, { withCredentials: true });
  }

  getTaskStats(userId: string, projectFilter: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/tasks/user/${userId}/stats${projectFilter}`, { withCredentials: true });
  }

  getProductivityStats(userId: string, projectFilter: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/analytics/user/${userId}${projectFilter}`, { withCredentials: true });
  }
}
