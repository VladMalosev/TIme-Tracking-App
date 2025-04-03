import { Component, OnInit, OnDestroy } from '@angular/core';
import {Observable, of, Subscription, switchMap, take} from 'rxjs';
import { TaskAssignmentService } from '../../../../../services/project-tasks/task-assignment.service';
import { TaskSelectionService } from '../../../../../services/my-tasks/task-selection.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {TimeLogListComponent} from './time-log-list/time-log-list.component';
import {ProjectContextService} from '../../../../../services/project-context.service';
import {TimeTrackingService} from '../../../../../services/time-tracking.service';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatButtonModule,
    MatCardModule,
    TimeLogListComponent
  ],
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss']
})
export class TaskDetailsComponent implements OnInit, OnDestroy {
  task: any;
  loading = true;
  private taskSubscription?: Subscription;
  projectId: string | null = null;
  manualStartTime: string = '';
  manualEndTime: string = '';
  manualDescription: string = '';
  manualTimeError: string | null = null;
  isRunning: boolean = false;
  elapsedTime: number = 0;
  timerInterval: any;
  description: string = '';
  errorMessage: string | null = null;
  private projectIdSubscription?: Subscription;

  readonly TASK_STATUS = {
    PENDING: 'PENDING',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    REOPENED: 'REOPENED'
  };

  constructor(
    private taskAssignmentService: TaskAssignmentService,
    private taskSelectionService: TaskSelectionService,
    private projectContextService: ProjectContextService,
    private timeTrackingService: TimeTrackingService
  ) {}

  ngOnInit(): void {
    this.projectIdSubscription = this.projectContextService.currentProjectId$.subscribe(
      projectId => this.projectId = projectId
    );

    this.taskSubscription = this.taskSelectionService.selectedTaskId$.subscribe(taskId => {
      if (taskId) {
        this.taskAssignmentService.userId$.pipe(
          take(1),
          switchMap(userId => {
            if (!userId) return of(null);
            return this.timeTrackingService.checkAndCleanActiveTimer(userId);
          }),
          switchMap(() => {
            this.loadTaskDetails(taskId);
            return this.checkActiveTimer(taskId);
          })
        ).subscribe();
      } else {
        this.task = null;
        this.stopTimer();
      }
    });
  }

  private checkActiveTimer(taskId: string): Observable<void> {
    return new Observable<void>(subscriber => {
      this.timeTrackingService.getActiveTimeLog(taskId).subscribe({
        next: (timeLog) => {
          if (timeLog) {
            const startTime = new Date(timeLog.startTime);
            this.elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
            this.isRunning = true;
            this.timerInterval = setInterval(() => {
              this.elapsedTime++;
            }, 1000);
          }
          subscriber.next();
          subscriber.complete();
        },
        error: (error) => {
          console.error('Error checking active timer:', error);
          if (error.status !== 404) {
            subscriber.error(error);
          } else {
            subscriber.next();
            subscriber.complete();
          }
        }
      });
    });
  }


  ngOnDestroy(): void {
    this.taskSubscription?.unsubscribe();
    this.projectIdSubscription?.unsubscribe();
    this.stopTimer();
  }

  reopenTask(): void {
    if (this.task) {
      this.taskAssignmentService.reopenTask(this.task.id)
        .subscribe({
          next: () => {
            this.task.status = this.TASK_STATUS.REOPENED;
          },
          error: (error) => {
            console.error('Error reopening task:', error);
            this.errorMessage = 'Failed to reopen task';
          }
        });
    }
  }

  loadTaskDetails(taskId: string): void {
    this.loading = true;
    this.task = null;
    this.taskAssignmentService.getTaskDetails(taskId).subscribe({
      next: (task) => {
        this.task = task;
        this.loading = false;
        console.log('Task details loaded:', task);
      },
      error: (error) => {
        console.error('Error loading task details:', error);
        this.loading = false;
      }
    });
  }


  startTimer(): void {
    if (!this.isRunning && this.task && this.projectId) {
      this.isRunning = true;
      const startTime = new Date();
      this.timerInterval = setInterval(() => {
        this.elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      }, 1000);

      this.timeTrackingService.startTimeLog(
        this.projectId,
        this.task.id,
        this.description
      ).subscribe({
        next: (response) => {
          console.log('Timer started successfully');

          if (this.task.status === this.TASK_STATUS.PENDING ||
            this.task.status === this.TASK_STATUS.ASSIGNED) {
            this.task.status = this.TASK_STATUS.IN_PROGRESS;
          }
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
  }


  stopTimer(): void {
    if (this.isRunning) {
      this.isRunning = false;
      clearInterval(this.timerInterval);

      this.timeTrackingService.stopTimeLog(this.task.id).subscribe({
        next: () => {
          console.log('Timer stopped successfully');
          this.elapsedTime = 0;
          this.taskSelectionService.triggerTimeLogsRefresh();
        },
        error: (error) => {
          console.error('Error stopping timer:', error);
          this.errorMessage = 'Failed to stop timer';
          this.isRunning = true;
          const startTime = new Date(new Date().getTime() - this.elapsedTime * 1000);
          this.timerInterval = setInterval(() => {
            this.elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
          }, 1000);
        }
      });
    }
  }

  closeDetails(): void {
    this.taskSelectionService.clearSelectedTaskId();
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  startTask(): void {
    if (this.task) {
      this.taskAssignmentService.updateTaskStatus(this.task.id, this.TASK_STATUS.IN_PROGRESS)
        .subscribe(() => {
          this.task.status = this.TASK_STATUS.IN_PROGRESS;
        });
    }
  }

  completeTask(): void {
    if (this.task) {
      this.taskAssignmentService.updateTaskStatus(this.task.id, this.TASK_STATUS.COMPLETED)
        .subscribe(() => {
          this.task.status = this.TASK_STATUS.COMPLETED;
          this.stopTimer();
        });
    }
  }

  createManualTimeLog(): void {
    if (!this.projectId) {
      this.manualTimeError = 'Project context is missing';
      console.error(this.manualTimeError);
      return;
    }

    if (this.task.status === this.TASK_STATUS.COMPLETED) {
      this.manualTimeError = 'Cannot add time logs to completed tasks. Please reopen the task first.';
      console.error(this.manualTimeError);
      return;
    }

    const startTime = this.formatForBackend(this.manualStartTime);
    const endTime = this.formatForBackend(this.manualEndTime);

    if (new Date(startTime) >= new Date(endTime)) {
      this.manualTimeError = 'End time must be after start time';
      console.error(this.manualTimeError);
      return;
    }

    this.timeTrackingService.createManualTimeLog(
      this.task.id,
      startTime,
      endTime,
      this.manualDescription
    ).subscribe({
      next: () => {
        console.log('Manual time log created successfully');
        this.manualTimeError = null;
        this.manualStartTime = '';
        this.manualEndTime = '';
        this.manualDescription = '';

        if (this.task.status === this.TASK_STATUS.PENDING ||
          this.task.status === this.TASK_STATUS.ASSIGNED) {
          this.task.status = this.TASK_STATUS.IN_PROGRESS;
        }

        this.taskSelectionService.triggerTimeLogsRefresh();
      },
      error: (error) => {
        console.error('Error creating manual time log:', error);
        this.manualTimeError = 'Failed to create manual time log';
      }
    });
  }

  private formatForBackend(datetime: string): string {
    if (datetime.length === 16) {
      return `${datetime}:00.000`;
    }
    return datetime;
  }
}
