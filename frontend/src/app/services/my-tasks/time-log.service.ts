import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../environments/environment';

interface TimeLog {
  id: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TimeLogService {
  constructor(private http: HttpClient) { }

  startTimer(userId: string, taskId: string | null, description: string): Observable<TimeLog> {
    return this.http.post<TimeLog>(
      `${environment.apiBaseUrl}/timelogs/start`,
      { userId, taskId, description },
      { withCredentials: true }
    );
  }

  stopTimer(userId: string, taskId: string | null): Observable<TimeLog> {
    return this.http.post<TimeLog>(
      `${environment.apiBaseUrl}/timelogs/stop`,
      { userId, taskId },
      { withCredentials: true }
    );
  }

  createManualTimeLog(
    userId: string,
    taskId: string | null,
    startTime: Date,
    endTime: Date,
    description: string
  ): Observable<TimeLog> {
    return this.http.post<TimeLog>(
      `${environment.apiBaseUrl}/timelogs/manual`,
      {
        userId,
        taskId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        description
      },
      { withCredentials: true }
    );
  }

  getTimeLogsByUser(userId: string): Observable<TimeLog[]> {
    return this.http.get<TimeLog[]>(
      `${environment.apiBaseUrl}/timelogs/user/${userId}`,
      { withCredentials: true }
    );
  }

  hasActiveTimer(userId: string, taskId: string | null): Observable<boolean> {
    const params: any = { userId };
    if (taskId) {
      params.taskId = taskId;
    }
    return this.http.get<boolean>(
      `${environment.apiBaseUrl}/timelogs/active`,
      { params, withCredentials: true }
    );
  }
  deleteTimeLog(logId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiBaseUrl}/timelogs/${logId}`,
      { withCredentials: true }
    );
  }
}
