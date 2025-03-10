import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = '/api/reports';

  constructor(private http: HttpClient) {}

  generateTaskReport(taskId: string, startTime: string, endTime: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/task`, {
      params: { taskId, startTime, endTime },
      responseType: 'blob'
    });
  }

  generateProjectReport(projectId: string, startTime: string, endTime: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/project`, {
      params: { projectId, startTime, endTime },
      responseType: 'blob'
    });
  }

  generateUserReport(userId: string, startTime: string, endTime: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/user`, {
      params: { userId, startTime, endTime },
      responseType: 'blob'
    });
  }
}
