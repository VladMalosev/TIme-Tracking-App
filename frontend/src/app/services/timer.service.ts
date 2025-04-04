import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable, of, Subscription } from 'rxjs';
import { switchMap, tap, take } from 'rxjs/operators';
import {TimeLogService} from './my-tasks/time-log.service';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private timerSub: Subscription | null = null;
  private elapsedSeconds = 0;
  private timer$ = new BehaviorSubject<number>(0);
  private isRunning$ = new BehaviorSubject<boolean>(false);
  private syncSub: Subscription | null = null;
  private currentProjectId: string | null = null;
  private currentDescription: string = '';
  private currentTaskId: string | null = null;
  constructor(private timeLogService: TimeLogService) {}

  startTimer(projectId: string, description: string, taskId: string | undefined): Observable<any> {
    return this.isRunning$.pipe(
      take(1),
      switchMap(isRunning => {
        if (isRunning) return of(null);

        return this.timeLogService.startProjectTimer(
          projectId,
          description,
          taskId || undefined
        ).pipe(
          tap(() => {
            this.isRunning$.next(true);
            this.startTimerInterval();
            this.startSyncInterval(projectId);
          })
        );
      })
    );
  }

  stopTimer(projectId: string): Observable<any> {
    return this.isRunning$.pipe(
      take(1),
      switchMap(isRunning => {
        if (!isRunning) return of(null);

        this.clearTimers();
        return this.timeLogService.stopProjectTimer(projectId).pipe(
          tap(() => {
            this.elapsedSeconds = 0;
            this.timer$.next(0);
            this.isRunning$.next(false);
          })
        );
      })
    );
  }

  getTimer(): Observable<number> {
    return this.timer$.asObservable();
  }

  getIsRunning(): Observable<boolean> {
    return this.isRunning$.asObservable();
  }

  private startTimerInterval(): void {
    this.clearTimers();
    const startTime = Date.now() - (this.elapsedSeconds * 1000);

    this.timerSub = interval(1000).subscribe(() => {
      this.elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      this.timer$.next(this.elapsedSeconds);
    });
  }

  private startSyncInterval(projectId: string): void {
    this.syncSub = interval(30000).pipe(
      switchMap(() => this.syncWithServer(projectId))
    ).subscribe();
  }

  syncWithServer(projectId: string): Observable<any> {
    return this.timeLogService.getActiveProjectTimer(projectId).pipe(
      tap(timeLog => {
        if (timeLog) {
          const serverSeconds = Math.floor((Date.now() - new Date(timeLog.startTime).getTime()) / 1000);
          if (Math.abs(serverSeconds - this.elapsedSeconds) > 5) {
            this.elapsedSeconds = serverSeconds;
            this.startTimerInterval();
          }
        }
      })
    );
  }

  private clearTimers(): void {
    if (this.timerSub) {
      this.timerSub.unsubscribe();
      this.timerSub = null;
    }
    if (this.syncSub) {
      this.syncSub.unsubscribe();
      this.syncSub = null;
    }
  }

  syncTimerState(
    projectId: string,
    elapsedTime: number,
    isRunning: boolean,
    description?: string,
    taskId?: string
  ): void {
    this.currentProjectId = projectId;
    this.elapsedSeconds = elapsedTime;
    this.timer$.next(elapsedTime);
    this.isRunning$.next(isRunning);
    this.currentDescription = description || '';
    this.currentTaskId = taskId || null;

    if (isRunning) {
      this.startTimerInterval();
    } else {
      this.clearTimers();
    }
  }

  clearTimerState(): void {
    this.currentProjectId = null;
    this.elapsedSeconds = 0;
    this.timer$.next(0);
    this.isRunning$.next(false);
    this.currentDescription = '';
    this.currentTaskId = null;
    this.clearTimers();
  }

  stopHeartbeat(): void {
    if (this.syncSub) {
      this.syncSub.unsubscribe();
      this.syncSub = null;
    }
  }

}

