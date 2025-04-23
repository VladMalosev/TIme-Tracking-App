import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(private http: HttpClient) {}

  generateTaskReport(taskId: string, startTime: string | null, endTime: string | null): Observable<any[]> {
    let url = `${environment.apiBaseUrl}/reports/task?taskId=${taskId}`;
    if (startTime) url += `&startTime=${startTime}`;
    if (endTime) url += `&endTime=${endTime}`;
    return this.http.get<any[]>(url, { withCredentials: true });
  }

  generateUserReport(userId: string, projectId: string, startTime: string | null, endTime: string | null): Observable<any[]> {
    let url = `${environment.apiBaseUrl}/reports/user?userId=${userId}&projectId=${projectId}`;
    if (startTime) url += `&startTime=${startTime}`;
    if (endTime) url += `&endTime=${endTime}`;
    return this.http.get<any[]>(url, { withCredentials: true });
  }

  generateProjectReport(projectId: string, startTime: string | null, endTime: string | null): Observable<any[]> {
    let url = `${environment.apiBaseUrl}/reports/project?projectId=${projectId}`;
    if (startTime) url += `&startTime=${startTime}`;
    if (endTime) url += `&endTime=${endTime}`;
    return this.http.get<any[]>(url, { withCredentials: true });
  }

  generateUserTimeLogsReport(startTime: string | null, endTime: string | null): Observable<any[]> {
    let url = `${environment.apiBaseUrl}/reports/user/timelogs`;
    if (startTime) url += `?startTime=${startTime}`;
    if (endTime) {
      url += startTime ? `&endTime=${endTime}` : `?endTime=${endTime}`;
    }
    return this.http.get<any[]>(url, { withCredentials: true });
  }

  downloadTaskPdf(taskId: string, startTime: string | null, endTime: string | null, taskName: string): Observable<Blob> {
    let url = `${environment.apiBaseUrl}/reports/task/pdf?taskId=${taskId}&taskName=${encodeURIComponent(taskName)}`;
    if (startTime) url += `&startTime=${startTime}`;
    if (endTime) url += `&endTime=${endTime}`;
    return this.http.get(url, { responseType: 'blob', withCredentials: true });
  }

  downloadUserPdf(userId: string, projectId: string, startTime: string | null, endTime: string | null, userName: string): Observable<Blob> {
    let url = `${environment.apiBaseUrl}/reports/user/pdf?userId=${userId}&projectId=${projectId}&userName=${encodeURIComponent(userName)}`;
    if (startTime) url += `&startTime=${startTime}`;
    if (endTime) url += `&endTime=${endTime}`;
    return this.http.get(url, { responseType: 'blob', withCredentials: true });
  }

  downloadProjectPdf(projectId: string, startTime: string | null, endTime: string | null, projectName: string): Observable<Blob> {
    let url = `${environment.apiBaseUrl}/reports/project/pdf?projectId=${projectId}&projectName=${encodeURIComponent(projectName)}`;
    if (startTime) url += `&startTime=${startTime}`;
    if (endTime) url += `&endTime=${endTime}`;
    return this.http.get(url, { responseType: 'blob', withCredentials: true });
  }

  getTasksForProject(projectId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/tasks/project/${projectId}`, { withCredentials: true });
  }

  getUsersForProject(projectId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/projects/${projectId}/users`, { withCredentials: true });
  }

  getProjectDetails(projectId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/projects/${projectId}`, { withCredentials: true });
  }

  generateCustomPdf(data: any[], startTime: string | null, endTime: string | null, filename: string, filters: any): Observable<Blob> {
    const requestBody = {
      data: data,
      filters: {
        startTime: startTime,
        endTime: endTime,
        projectId: filters.project?.id,
        userId: filters.user?.id,
        taskId: filters.task?.id,
        groupBy: filters.groupBy
      },
      sortColumn: filters.sortColumn || '',
      sortDirection: filters.sortDirection || ''
    };

    return this.http.post(`${environment.apiBaseUrl}/reports/custom-pdf`, requestBody, {
      responseType: 'blob'
    });
  }
}
