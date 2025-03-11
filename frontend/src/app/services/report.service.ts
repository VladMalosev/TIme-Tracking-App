import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportService {


  constructor(private http: HttpClient) {}

  generateTaskReport(taskId: string, startTime: string | null, endTime: string | null): Observable<any[]> {
    let url = `http://localhost:8080/api/reports/task?taskId=${taskId}`;
    if (startTime) url += `&startTime=${startTime}`;
    if (endTime) url += `&endTime=${endTime}`;
    return this.http.get<any[]>(url, { withCredentials: true });
  }

  generateProjectReport(projectId: string, startTime: string | null, endTime: string | null): Observable<any[]> {
    let url = `http://localhost:8080/api/reports/project?projectId=${projectId}`;
    if (startTime) url += `&startTime=${startTime}`;
    if (endTime) url += `&endTime=${endTime}`;
    return this.http.get<any[]>(url, { withCredentials: true });
  }

  generateUserReport(userId: string, projectId: string, startTime: string | null, endTime: string | null): Observable<any[]> {
    let url = `http://localhost:8080/api/reports/user?userId=${userId}&projectId=${projectId}`;
    if (startTime) url += `&startTime=${startTime}`;
    if (endTime) url += `&endTime=${endTime}`;
    return this.http.get<any[]>(url, { withCredentials: true });
  }
}
