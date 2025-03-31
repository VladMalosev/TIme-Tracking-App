import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { TimeLogService } from '../../../../../../../services/my-tasks/time-log.service';
import { ProjectContextService } from '../../../../../../../services/project-context.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-project-time-log-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatMenuModule,
    MatExpansionModule,
  ],
  templateUrl: './project-time-log-list.component.html',
  styleUrls: ['./project-time-log-list.component.scss']
})
export class ProjectTimeLogListComponent implements OnInit, OnDestroy {
  allTimeLogs: any[] = [];
  paginatedTimeLogs: any[] = [];
  groupedLogs: {[key: string]: any} = {};
  taskTotals: {[key: string]: string} = {};
  displayMode: 'flat' | 'grouped' = 'grouped';

  displayedColumnsGrouped: string[] = ['startedAt', 'endedAt', 'duration', 'description', 'actions'];
  displayedColumnsFlat: string[] = ['task', 'startedAt', 'endedAt', 'duration', 'description', 'actions'];

  loading = true;
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;

  private projectId: string | null = null;
  private routeSub?: Subscription;

  constructor(
    private timeLogService: TimeLogService,
    private projectContextService: ProjectContextService
  ) {}

  ngOnInit(): void {
    this.loadData();

    this.routeSub = this.projectContextService.currentProjectId$.subscribe(projectId => {
      this.projectId = projectId;
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  loadData(): void {
    this.projectId = this.projectContextService.getCurrentProjectId();
    if (this.projectId) {
      this.loadTimeLogs(this.projectId);
    } else {
      this.loading = false;
      this.allTimeLogs = [];
      this.paginatedTimeLogs = [];
      this.groupedLogs = {};
      this.taskTotals = {};
      this.totalItems = 0;
    }
  }

  loadTimeLogs(projectId: string): void {
    this.loading = true;
    this.timeLogService.getProjectTimeLogs(projectId).subscribe({
      next: (logs) => {
        this.allTimeLogs = logs;
        this.totalItems = logs.length;
        this.calculateTaskTotals();
        this.updatePaginatedData();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  calculateTaskTotals(): void {
    this.taskTotals = {};
    const taskLogs: {[key: string]: any[]} = {};

    this.allTimeLogs.forEach(log => {
      const taskId = log.task?.id || 'no-task';
      if (!taskLogs[taskId]) {
        taskLogs[taskId] = [];
      }
      taskLogs[taskId].push(log);
    });

    Object.keys(taskLogs).forEach(taskId => {
      this.taskTotals[taskId] = this.calculateDuration(taskLogs[taskId]);
    });
  }

  updatePaginatedData(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedTimeLogs = this.allTimeLogs.slice(startIndex, endIndex);
    this.groupLogsByTask();
  }
  groupLogsByTask(): void {
    this.groupedLogs = {};
    this.paginatedTimeLogs.forEach(log => {
      const taskId = log.task?.id || 'no-task';
      if (!this.groupedLogs[taskId]) {
        this.groupedLogs[taskId] = {
          logs: [],
          expanded: false,
          taskName: this.getTaskName(log)
        };
      }
      this.groupedLogs[taskId].logs.push(log);
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedData();
  }

  toggleDisplayMode(): void {
    this.displayMode = this.displayMode === 'flat' ? 'grouped' : 'flat';
  }

  getTaskName(log: any): string {
    return log.task?.name || 'No task';
  }

  getTotalDuration(taskId: string): string {
    return this.taskTotals[taskId] || '0h 0m';
  }

  calculateDuration(logs: any[]): string {
    const totalSeconds = logs.reduce((sum, log) => {
      const start = new Date(log.startTime);
      const end = new Date(log.endTime);
      return sum + (end.getTime() - start.getTime()) / 1000;
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  formatDuration(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = (endDate.getTime() - startDate.getTime()) / 1000;

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  protected readonly Object = Object;
}
