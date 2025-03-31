import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {TimeLogService} from '../../../../../../../services/my-tasks/time-log.service';
import {ProjectContextService} from '../../../../../../../services/project-context.service';

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
    MatMenuModule
  ],
  templateUrl: './project-time-log-list.component.html',
  styleUrls: ['./project-time-log-list.component.scss']
})
export class ProjectTimeLogListComponent implements OnInit {
  timeLogs: any[] = [];
  groupedLogs: {[key: string]: any[]} = {};
  displayMode: 'flat' | 'grouped' = 'grouped';
  displayedColumnsGrouped: string[] = ['date', 'duration', 'description', 'actions'];

  displayedColumnsFlat: string[] = ['task', 'startedAt', 'endedAt', 'duration', 'description', 'actions'];
  loading = true;
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;

  constructor(private timeLogService: TimeLogService,
              private projectContextService: ProjectContextService) {}

  ngOnInit(): void {
    const projectId = this.projectContextService.getCurrentProjectId();
    if (projectId) {
      this.loadTimeLogs(projectId);
    }
  }

  loadTimeLogs(projectId: string): void {
    this.loading = true;
    this.timeLogService.getProjectTimeLogs(projectId).subscribe({
      next: (logs) => {
        this.timeLogs = logs;
        this.groupLogsByTask();
        this.totalItems = logs.length;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  groupLogsByTask(): void {
    this.groupedLogs = {};
    this.timeLogs.forEach(log => {
      const taskId = log.task?.id || 'no-task';
      if (!this.groupedLogs[taskId]) {
        this.groupedLogs[taskId] = [];
      }
      this.groupedLogs[taskId].push(log);
    });
  }

  getTaskName(log: any): string {
    return log.task?.name || 'No task';
  }

  getTotalDuration(logs: any[]): string {
    const totalSeconds = logs.reduce((sum, log) => {
      const start = new Date(log.startTime);
      const end = new Date(log.endTime);
      return sum + (end.getTime() - start.getTime()) / 1000;
    }, 0);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  toggleDisplayMode(): void {
    this.displayMode = this.displayMode === 'flat' ? 'grouped' : 'flat';
  }

  formatDuration(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = (endDate.getTime() - startDate.getTime()) / 1000;

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  protected readonly Object = Object;
}
