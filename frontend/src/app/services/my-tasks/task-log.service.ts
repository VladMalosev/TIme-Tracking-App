import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../environments/environment';

interface TaskLog {
  id: string;
  taskId: string;
  description: string;
  timeSpent: number;
  date: Date;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TaskLogService {
  constructor(private http: HttpClient) { }

  getTaskLogs(taskId: string): Observable<TaskLog[]> {
    return this.http.get<TaskLog[]>(
      `${environment.apiBaseUrl}/tasks/${taskId}/logs`,
      { withCredentials: true }
    );
  }

  createTaskLog(taskId: string, logData: {
    description: string;
    timeSpent: number;
    date: Date;
  }): Observable<TaskLog> {
    return this.http.post<TaskLog>(
      `${environment.apiBaseUrl}/tasks/${taskId}/logs`,
      logData,
      { withCredentials: true }
    );
  }

  deleteTaskLog(logId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiBaseUrl}/task-logs/${logId}`,
      { withCredentials: true }
    );
  }

  getUserTaskLogs(userId: string): Observable<TaskLog[]> {
    return this.http.get<TaskLog[]>(
      `${environment.apiBaseUrl}/users/${userId}/task-logs`,
      { withCredentials: true }
    );
  }
}
