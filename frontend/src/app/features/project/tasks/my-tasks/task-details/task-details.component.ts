import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TaskAssignmentService } from '../../../../../services/project-tasks/task-assignment.service';
import { Subscription } from 'rxjs';
import {TaskStateService} from '../../../../../services/my-tasks/task-state.service';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss']
})
export class TaskDetailsComponent implements OnInit, OnDestroy {
  task: any;
  loading = true;
  private taskSubscription?: Subscription;

  readonly TASK_STATUS = {
    PENDING: 'PENDING',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
  };

  constructor(
    private taskAssignmentService: TaskAssignmentService,
    private taskStateService: TaskStateService
  ) {}

  ngOnInit(): void {
    this.taskSubscription = this.taskStateService.selectedTaskId$.subscribe(taskId => {
      if (taskId) {
        this.loadTaskDetails(taskId);
      } else {
        this.task = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.taskSubscription?.unsubscribe();
  }


  loadTaskDetails(taskId: string): void {
    this.loading = true;
    this.task = null; // Clear previous task while loading
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

  getStatusColor(status: string): string {
    switch(status) {
      case this.TASK_STATUS.PENDING: return 'warn';
      case this.TASK_STATUS.ASSIGNED: return 'primary';
      case this.TASK_STATUS.IN_PROGRESS: return 'accent';
      case this.TASK_STATUS.COMPLETED: return 'success';
      default: return '';
    }
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
        });
    }
  }
}
