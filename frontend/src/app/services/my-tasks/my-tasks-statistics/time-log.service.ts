import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {TimeLog, TimeLogDisplay} from '../../../models';
import {environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimeLogService {
  private timeLogsSubject = new BehaviorSubject<TimeLogDisplay[]>([]);
  timeLogs$ = this.timeLogsSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadTimeLogs(userId: string, projectId: string | null = null): void {
    const projectFilter = projectId ? `?projectId=${projectId}` : '';
    this.http.get<TimeLog[]>(`${environment.apiBaseUrl}/timelogs/user/${userId}${projectFilter}`,
      { withCredentials: true })
      .pipe(
        catchError(err => {
          console.error('Error loading time logs:', err);
          return of([]);
        })
      )
      .subscribe(logs => {
        const formattedLogs = logs.map(log => ({
          date: new Date(log.startTime),
          taskName: log.task?.name || 'No task',
          duration: log.minutes || 0,
          description: log.description || 'No description'
        }));
        this.timeLogsSubject.next(formattedLogs);
      });
  }
}
