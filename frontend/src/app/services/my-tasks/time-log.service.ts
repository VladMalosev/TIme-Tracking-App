import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap, take } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';

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

  startProjectTimer(projectId: string, description: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        return this.http.post(
          `${environment.apiBaseUrl}/timelogs/start`,
          { userId, projectId, description },
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
    description: string
  ): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        return this.http.post(
          `${environment.apiBaseUrl}/timelogs/manual`,
          { userId, projectId, startTime, endTime, description },
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


}
