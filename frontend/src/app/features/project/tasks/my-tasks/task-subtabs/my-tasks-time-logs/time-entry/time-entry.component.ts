import { Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TimeLogService } from '../../../../../../../services/my-tasks/time-log.service';
import { TimeEntryStateService } from '../../../../../../../services/my-tasks/time-entry-state.service';
import {
  catchError,
  fromEvent,
  interval,
  map,
  Observable,
  of,
  Subscription,
  switchMap,
  takeWhile,
  tap,
  timer
} from 'rxjs';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-time-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './time-entry.component.html',
  styleUrls: ['./time-entry.component.scss']
})
export class TimeEntryComponent implements OnInit, OnDestroy {
  isRunning = false;
  elapsedTime = 0;
  timerInterval: any;
  errorMessage: string | null = null;
  manualTimeError: string | null = null;

  selectedTaskId: string | null = null;
  manualStartTime: string = '';
  manualEndTime: string = '';
  manualDescription: string = '';

  projectId: string | null = null;
  userId: string | null = null;
  incompleteTasks: any[] = [];
  tasksLoading = false;

  private isTabVisible = true;
  private syncInterval$: Subscription | null = null;
  private visibilityChangeSubscription?: Subscription;
  private heartbeatInterval$: Subscription | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000;
  private readonly SYNC_INTERVAL = 1000;
  private destroyRef = inject(DestroyRef);
  private subs = new Subscription();
  private isDescriptionModified = false;

  constructor(
    private timeLogService: TimeLogService,
    private timeEntryState: TimeEntryStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupVisibilityTracking();

    this.subs.add(
      this.timeEntryState.timerStopped$.subscribe(timerId => {
        if (this.isRunning) {
          this.isRunning = false;
          clearInterval(this.timerInterval);
          this.stopHeartbeat();
          this.elapsedTime = 0;

          this.syncTimerWithServer().subscribe();
        }
      })
    );
  }

  private initializeComponent(): void {
    this.subs.add(
      this.timeEntryState.projectId$.pipe(
        tap(projectId => {
          this.projectId = projectId;
          console.log('Current Project ID in TimeEntryComponent:', projectId);
          if (!projectId) {
            console.error('No projectId available in TimeEntryComponent');
          }
        }),
        switchMap(projectId => {
          if (!projectId) return of(null);
          return this.timeEntryState.userId$;
        }),
        tap(userId => {
          this.userId = userId;
          console.log('Current User ID:', userId);
        }),
        switchMap(() => this.checkActiveTimer()),
        tap(() => this.loadIncompleteTasks()),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe()
    );
  }

  private checkActiveTimer(): Observable<void> {
    return new Observable(observer => {
      if (!this.projectId) {
        observer.complete();
        return;
      }

      this.timeLogService.getActiveProjectTimer(this.projectId).subscribe({
        next: (timeLog) => {
          if (timeLog) {
            const startTime = new Date(timeLog.startTime);
            this.elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
            this.isRunning = true;
            this.startTimerInterval();
            this.manualDescription = timeLog.description || '';
            this.selectedTaskId = timeLog.task?.id || null;
            this.isDescriptionModified = false;
          }
          observer.next();
          observer.complete();
        },
        error: (error) => {
          console.error('Error checking active timer:', error);
          observer.error(error);
        }
      });
    });
  }

  startTimer(): void {
    if (this.isRunning || !this.projectId) return;

    this.isRunning = true;
    this.isDescriptionModified = false;
    const initialDescription = this.manualDescription;
    const startTime = new Date();
    this.startTimerInterval();

    this.timeLogService.startProjectTimer(
      this.projectId,
      initialDescription,
      this.selectedTaskId || undefined
    ).subscribe({
      next: () => {
        console.log('Timer started successfully');
        this.setupHeartbeat();
      },
      error: (error) => {
        console.error('Error starting timer:', error);
        this.errorMessage = error.error?.message || error.message || 'Failed to start timer';
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.elapsedTime = 0;
      }
    });
  }

  updateTimerDescription(): void {
    if (!this.isRunning || !this.projectId || !this.manualDescription) return;

    if (this.isDescriptionModified) {
      this.timeLogService.getActiveProjectTimer(this.projectId).subscribe({
        next: (timeLog) => {
          if (timeLog) {
            this.timeLogService.updateTimeLogDescription(timeLog.id, this.manualDescription)
              .subscribe({
                next: () => console.log('Description updated successfully'),
                error: (err) => console.error('Failed to update description:', err)
              });
          }
        },
        error: (err) => console.error('Failed to get active timer:', err)
      });
    }
  }

  onDescriptionChange(): void {
    if (this.isRunning) {
      this.isDescriptionModified = true;
      this.updateTimerDescription();
    }
  }

  stopTimer(): void {
    if (!this.isRunning || !this.projectId) return;

    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.stopHeartbeat();

    this.updateTimerDescription();

    this.timeLogService.stopProjectTimer(this.projectId).subscribe({
      next: () => {
        this.elapsedTime = 0;
        this.timeEntryState.notifyTimeLogCreated();
        this.isDescriptionModified = false;
      },
      error: (error) => {
        console.error('Error stopping timer:', error);
        this.errorMessage = 'Failed to stop timer';
        this.isRunning = true;
        const startTime = new Date(new Date().getTime() - this.elapsedTime * 1000);
        this.startTimerInterval();
        this.setupHeartbeat();
      }
    });
  }

  private startTimerInterval(): void {
    const startTime = new Date(new Date().getTime() - this.elapsedTime * 1000);
    this.timerInterval = setInterval(() => {
      this.elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    }, 1000);
  }

  private setupVisibilityTracking(): void {
    const visibilityChange$ = fromEvent(document, 'visibilitychange').pipe(
      map(() => !document.hidden)
    );

    this.subs.add(
      visibilityChange$.subscribe(isVisible => {
        if (isVisible && this.projectId && this.isRunning) {
          this.syncTimerWithServer().subscribe();
        }
      })
    );
  }

  private setupHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval$ = interval(this.HEARTBEAT_INTERVAL).pipe(
      takeWhile(() => this.isRunning),
      switchMap(() => {
        if (!this.projectId || !this.userId) {
          return of(null);
        }
        return this.timeLogService.updateTimerHeartbeat(this.userId, this.projectId);
      })
    ).subscribe({
      error: (err) => console.error('Heartbeat failed:', err)
    });
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval$) {
      this.heartbeatInterval$.unsubscribe();
      this.heartbeatInterval$ = null;
    }
  }

  private syncTimerWithServer(): Observable<void> {
    if (!this.projectId || !this.userId || !this.isRunning) {
      return of(undefined);
    }

    return this.timeLogService.getActiveProjectTimer(this.projectId).pipe(
      tap(timeLog => {
        if (timeLog) {
          const startTime = new Date(timeLog.startTime);
          this.elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        }
      }),
      catchError(error => {
        console.error('Sync failed:', error);
        return of(undefined);
      }),
      map(() => undefined)
    );
  }

  loadIncompleteTasks(): void {
    if (!this.projectId || !this.userId) {
      console.warn('Cannot load tasks - missing projectId or userId', {
        projectId: this.projectId,
        userId: this.userId
      });
      return;
    }

    console.log('Loading tasks for project:', this.projectId);
    this.tasksLoading = true;

    this.timeLogService.getIncompleteTasks(this.projectId).subscribe({
      next: (tasks) => {
        console.log('Received tasks:', tasks);
        this.incompleteTasks = tasks;
        this.tasksLoading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.tasksLoading = false;
      }
    });
  }

  createManualTimeLog(): void {
    console.log('Creating manual log with projectId:', this.projectId);

    if (!this.manualStartTime || !this.manualEndTime) {
      this.manualTimeError = 'Start time and end time are required';
      return;
    }

    const startTime = this.formatForBackend(this.manualStartTime);
    const endTime = this.formatForBackend(this.manualEndTime);

    if (new Date(startTime) >= new Date(endTime)) {
      this.manualTimeError = 'End time must be after start time';
      return;
    }

    if (!this.projectId) {
      this.manualTimeError = 'Project ID is missing - please refresh the page';
      console.error('Project ID is null when trying to create manual log');
      return;
    }

    this.timeLogService.createManualProjectTimeLog(
      this.projectId,
      startTime,
      endTime,
      this.manualDescription,
      this.selectedTaskId || undefined
    ).subscribe({
      next: () => {
        this.manualTimeError = null;
        this.manualStartTime = '';
        this.manualEndTime = '';
        this.manualDescription = '';
        this.selectedTaskId = null;
        this.timeEntryState.notifyTimeLogCreated();
      },
      error: (error) => {
        console.error('Detailed error creating manual time log:', error);
        this.manualTimeError = error.error?.message || 'Failed to create manual time log';
      }
    });
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private formatForBackend(datetime: string): string {
    if (datetime.length === 16) {
      return `${datetime}:00.000`;
    }
    return datetime;
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.stopHeartbeat();
    this.subs.unsubscribe();
  }
}
