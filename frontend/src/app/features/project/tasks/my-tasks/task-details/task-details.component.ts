import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
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

  manualStartTime: string = '';
  manualEndTime: string = '';
  manualDescription: string = '';
  manualTimeError: string | null = null;
  isRunning: boolean = false;
  elapsedTime: number = 0;
  timerInterval: any;
  description: string = '';
  errorMessage: string | null = null;

  readonly TASK_STATUS = {
    PENDING: 'PENDING',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    REOPENED: 'REOPENED'
  };

  constructor(
    private taskAssignmentService: TaskAssignmentService,
    private taskSelectionService: TaskSelectionService
  ) {}

  ngOnInit(): void {
    this.taskSubscription = this.taskSelectionService.selectedTaskId$.subscribe(taskId => {
      if (taskId) {
        this.loadTaskDetails(taskId);
      } else {
        this.task = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.taskSubscription?.unsubscribe();
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
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  startTimer(): void {
    if (!this.isRunning && this.task) {
      this.isRunning = true;
      const startTime = new Date();
      this.timerInterval = setInterval(() => {
        this.elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      }, 1000);

      this.taskAssignmentService.startTimeLog(this.task.id, this.description).subscribe({
        next: () => console.log('Timer started'),
        error: (error) => {
          console.error('Error starting timer:', error);
          this.errorMessage = error.message || 'Failed to start timer';
          this.isRunning = false;
          clearInterval(this.timerInterval);
          this.elapsedTime = 0;
        }
      });
    }
  }

  stopTimer(): void {
    if (this.isRunning && this.task) {
      this.isRunning = false;
      clearInterval(this.timerInterval);

      this.taskAssignmentService.stopTimeLog(this.task.id).subscribe({
        next: () => {
          console.log('Timer stopped');
          this.elapsedTime = 0;
          this.taskSelectionService.triggerTimeLogsRefresh();
        },
        error: (error) => {
          console.error('Error stopping timer:', error);
          this.errorMessage = 'Failed to stop timer';
        }
      });
    }
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
    if (!this.manualStartTime || !this.manualEndTime) {
      this.manualTimeError = 'Start time and end time are required';
      return;
    }

    if (this.task.status === this.TASK_STATUS.COMPLETED) {
      this.manualTimeError = 'Cannot add time logs to completed tasks. Please reopen the task first.';
      return;
    }

    const startTime = this.formatForBackend(this.manualStartTime);
    const endTime = this.formatForBackend(this.manualEndTime);

    if (new Date(startTime) >= new Date(endTime)) {
      this.manualTimeError = 'End time must be after start time';
      return;
    }

    this.taskAssignmentService.createManualTimeLog(
      this.task.id,
      startTime,
      endTime,
      this.manualDescription
    ).subscribe({
      next: () => {
        console.log('Manual time log created');
        this.manualTimeError = null;
        this.manualStartTime = '';
        this.manualEndTime = '';
        this.manualDescription = '';
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
