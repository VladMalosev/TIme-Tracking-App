import { Component } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { TaskListService } from '../../../../services/dashboard/task-list.service';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {TimeLogService} from '../../../../services/my-tasks/time-log.service';
import {MatTooltip} from '@angular/material/tooltip';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {async} from 'rxjs';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  standalone: true,
  imports: [
    MatIcon,
    DatePipe,
    MatIconButton,
    MatButton,
    CommonModule,
    MatProgressSpinner,
    MatTooltip,
    MatPaginator,
  ],
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent {
  taskDurations: {[key: string]: string} = {};
  pageSize = 3;
  pageIndex = 0;
  pageSizeOptions = [3, 5, 7];
  tasks: any[] = [];

  constructor(
    public taskListService: TaskListService,
    private timeLogService: TimeLogService
  ) {
    this.taskListService.tasks$.subscribe(tasks => {
      this.tasks = tasks || [];
    });
  }

  handlePageEvent(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
  }

  get paginatedTasks(): any[] {
    const startIndex = this.pageIndex * this.pageSize;
    return this.tasks.slice(startIndex, startIndex + this.pageSize);
  }

  isTaskUrgent(task: any): boolean {
    return this.taskListService.isTaskUrgent(task);
  }

  onViewAllTasks(): void {
    this.taskListService.triggerViewAllTasks();
  }

  onLogTaskTime(task: any): void {
    this.taskListService.triggerLogTaskTime(task);
  }

  getTotalDuration(taskId: string): string {
    if (this.taskDurations[taskId]) {
      return this.taskDurations[taskId];
    }

    this.timeLogService.getTimeLogsByTask(taskId).subscribe(logs => {
      this.taskDurations[taskId] = this.calculateDuration(logs);
    });

    return 'Loading...';
  }

  private calculateDuration(logs: any[]): string {
    if (!logs || logs.length === 0) return '0h 0m';

    const totalSeconds = logs.reduce((sum, log) => {
      const start = new Date(log.startTime);
      const end = new Date(log.endTime);
      return sum + (end.getTime() - start.getTime()) / 1000;
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}
