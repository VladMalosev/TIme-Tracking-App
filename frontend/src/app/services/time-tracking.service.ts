// time-tracking.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject, finalize, map, Observable, of, switchMap, take, tap} from 'rxjs';
import {environment} from '../../environments/environment';
import {AuthService} from '../core/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class TimeTrackingService {
  constructor(private http: HttpClient,
              private authService: AuthService) {}

  private activeTimerCheckInProgress = false;
  private projectIdSubject = new BehaviorSubject<string>('');

  get userId$() {
    return this.authService.userId$;
  }

  checkAndCleanActiveTimer(userId: string): Observable<void> {
    if (this.activeTimerCheckInProgress) {
      return of(undefined as void);
    }

    this.activeTimerCheckInProgress = true;
    return this.http.get<any>(
      `${environment.apiBaseUrl}/timelogs/active?userId=${userId}`,
      { withCredentials: true }
    ).pipe(
      switchMap(activeLog => {
        if (!activeLog) {
          return of(undefined as void);
        }

        const startTime = new Date(activeLog.startTime);
        const hoursRunning = (new Date().getTime() - startTime.getTime()) / (1000 * 60 * 60);

        if (hoursRunning > 24) {
          return this.http.delete(
            `${environment.apiBaseUrl}/timelogs/${activeLog.id}`,
            { withCredentials: true }
          ).pipe(
            map(() => undefined as void)
          );
        }

        return of(undefined as void);
      }),
      finalize(() => {
        this.activeTimerCheckInProgress = false;
      })
    );
  }


  startTimeLog(projectId: string, taskId: string, description: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          console.error('User ID not available');
          throw new Error('User ID not available');
        }
        if (!projectId) {
          console.error('Project ID is required');
          throw new Error('Project ID is required');
        }

        const body = {
          userId: userId,
          projectId: projectId,
          taskId: taskId || null,
          description: description || ""
        };

        return this.http.post(
          `${environment.apiBaseUrl}/timelogs/start`,
          body,
          { withCredentials: true,
            observe: 'response'
          }
        ).pipe(
          tap(response => {
            console.log('Server response:', {
              status: response.status,
              body: response.body,
              headers: response.headers
            });
          })
        );
      })
    );
  }

  stopTimeLog(taskId: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) throw new Error('User ID not available');
        return this.http.post(
          `${environment.apiBaseUrl}/timelogs/stop`,
          { userId },
          { withCredentials: true }
        );
      })
    );
  }

  getActiveTimeLog(taskId: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) throw new Error('User ID not available');
        return this.http.get<any>(
          `${environment.apiBaseUrl}/timelogs/active?userId=${userId}&taskId=${taskId}`,
          { withCredentials: true }
        );
      })
    );
  }

  createManualTimeLog(taskId: string, startTime: string, endTime: string, description: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        if (!this.projectIdSubject.value) {
          throw new Error('Project ID is required');
        }
        return this.http.post(
          `${environment.apiBaseUrl}/timelogs/manual`,
          {
            userId,
            projectId: this.projectIdSubject.value,
            taskId,
            startTime: this.formatForBackend(startTime),
            endTime: this.formatForBackend(endTime),
            description
          },
          { withCredentials: true }
        );
      })
    );
  }

  private formatForBackend(datetime: string): string {
    if (!datetime) return datetime;

    if (datetime.length === 16) {
      return `${datetime}:00.000`;
    }
    return datetime;
  }

}
