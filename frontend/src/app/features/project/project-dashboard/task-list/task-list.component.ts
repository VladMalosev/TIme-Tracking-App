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
import {Router} from '@angular/router';
import {ProjectContextService} from '../../../../services/project-context.service';

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
    private timeLogService: TimeLogService,
    private router: Router,
    private projectContextService: ProjectContextService
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
    const projectId = this.projectContextService.getCurrentProjectId();
    if (projectId) {
      this.router.navigate([`/project-details/${projectId}/dashboard`], {
        queryParams: { tab: 'tasks', subTab: 'assigned-tasks' }
      });
    }
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

  onViewTask(task: any): void {
    const projectId = this.projectContextService.getCurrentProjectId();
    if (projectId && task?.id) {
      this.router.navigate([`/project-details/${projectId}/dashboard`], {
        queryParams: {
          tab: 'tasks',
          subTab: 'assigned-tasks',
          taskId: task.id
        }
      });
    }
  }

}
