import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, catchError, map, Observable, of, switchMap, take, throwError} from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import {TimeLog} from '../../models';

@Injectable({
  providedIn: 'root'
})
export class TimeLogService {

  private userIdSubject = new BehaviorSubject<string | null>(null);
  userId$ = this.userIdSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService.userId$.subscribe(userId => {
      if (userId) {
        this.userIdSubject.next(userId);
      }
    });

    this.authService.getUserId();
  }

  setUserId(userId: string): void {
    this.userIdSubject.next(userId);
  }

  getTimeLogsByTask(taskId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiBaseUrl}/timelogs/task/${taskId}`,
      { withCredentials: true }
    );
  }

  startProjectTimer(projectId: string, description: string, taskId?: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        return this.http.post(
          `${environment.apiBaseUrl}/timelogs/start`,
          {
            userId,
            projectId,
            description,
            taskId: taskId || null
          },
          { withCredentials: true }
        );
      })
    );
  }

  stopProjectTimer(projectId: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        return this.http.post(
          `${environment.apiBaseUrl}/timelogs/stop`,
          { userId, projectId },
          { withCredentials: true }
        );
      })
    );
  }

  createManualProjectTimeLog(
    projectId: string,
    startTime: string,
    endTime: string,
    description: string,
    taskId?: string
  ): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        return this.http.post(
          `${environment.apiBaseUrl}/timelogs/manual`,
          {
            userId,
            projectId,
            startTime,
            endTime,
            description,
            taskId: taskId || null
          },
          { withCredentials: true }
        );
      })
    );
  }

  getProjectTimeLogs(projectId: string): Observable<any[]> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        return this.http.get<any[]>(
          `${environment.apiBaseUrl}/timelogs/project/${projectId}/user/${userId}`,
          { withCredentials: true }
        );
      })
    );
  }

  getIncompleteTasks(projectId: string): Observable<any[]> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        return this.http.get<any[]>(
          `${environment.apiBaseUrl}/tasks/project/${projectId}/user/${userId}/incomplete`,
          { withCredentials: true }
        );
      })
    );
  }

  linkTimeLogToTask(timeLogId: string, taskId: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        return this.http.put(
          `${environment.apiBaseUrl}/timelogs/${timeLogId}/link-task?taskId=${taskId}&userId=${userId}`,
          {},
          { withCredentials: true }
        );
      })
    );
  }

  updateTimeLogDescription(timeLogId: string, description: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        return this.http.put(
          `${environment.apiBaseUrl}/timelogs/${timeLogId}/description`,
          { description },
          { withCredentials: true }
        );
      })
    );
  }

  deleteTimeLog(timeLogId: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        return this.http.delete(
          `${environment.apiBaseUrl}/timelogs/${timeLogId}`,
          { withCredentials: true }
        );
      })
    );
  }

  getActiveProjectTimer(projectId: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        return this.http.get<any>(
          `${environment.apiBaseUrl}/timelogs/active/project/${projectId}?userId=${userId}`,
          { withCredentials: true }
        );
      })
    );
  }



  updateTimerHeartbeat(userId: string, projectId: string): Observable<any> {
    return this.http.post(
      `${environment.apiBaseUrl}/timelogs/heartbeat`,
      null,
      {
        params: {
          userId,
          projectId
        },
        withCredentials: true
      }
    );
  }



  getTimerDuration(userId: string, projectId: string): Observable<number> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        return this.http.get<number>(
          `${environment.apiBaseUrl}/timelogs/duration`,
          {
            params: { userId, projectId },
            withCredentials: true
          }
        );
      })
    );
  }


  getActiveTimers(): Observable<any[]> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        return this.http.get<any[]>(
          `${environment.apiBaseUrl}/timelogs/active/user/${userId}`,
          { withCredentials: true }
        );
      })
    );
  }

  stopTimer(timeLogId: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          return throwError(() => new Error('User ID not available'));
        }
        return this.http.post(
          `${environment.apiBaseUrl}/timelogs/${timeLogId}/stop`,
          { userId },
          { withCredentials: true }
        ).pipe(
          catchError(error => {
            console.error('Failed to stop timer:', error);
            return throwError(() => error);
          })
        );
      })
    );
  }

  getRecentTasks(userId: string, limit: number = 5): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiBaseUrl}/timelogs/user/${userId}/recent-tasks?limit=${limit}`,
      {withCredentials: true}
    );
  }

}
