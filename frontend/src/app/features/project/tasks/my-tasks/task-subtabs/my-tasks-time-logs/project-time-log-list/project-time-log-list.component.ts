import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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
import {Subject, Subscription, takeUntil} from 'rxjs';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {TimeLogFilterService} from '../../../../../../../services/my-tasks/time-log-filter.service';

@Component({
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatMenuModule,
    MatExpansionModule,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    FormsModule,
    MatInput,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  selector: 'app-project-time-log-list',
  standalone: true,
  styleUrls: ['./project-time-log-list.component.scss'],
  templateUrl: './project-time-log-list.component.html'
})
export class ProjectTimeLogListComponent implements OnInit, OnDestroy {
  allTimeLogs: any[] = [];
  paginatedTimeLogs: any[] = [];
  groupedLogs: {[key: string]: any} = {};
  taskTotals: {[key: string]: string} = {};
  displayMode: 'flat' | 'grouped' = 'flat';
  showLinkDialog = false;
  selectedTimeLog: any = null;
  selectedTaskId: string | null = null;
  assignedTasks: any[] = [];
  showEditDialog = false;
  editDescriptionText = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';



  displayedColumnsGrouped: string[] = ['startedAt', 'endedAt', 'duration', 'description', 'actions'];
  displayedColumnsFlat: string[] = ['task', 'startedAt', 'endedAt', 'duration', 'description', 'actions'];

  loading = true;
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;

  private projectId: string | null = null;
  private routeSub?: Subscription;
  private destroy$ = new Subject<void>();


  constructor(
    private timeLogService: TimeLogService,
    private projectContextService: ProjectContextService,
    private timeLogFilterService: TimeLogFilterService
  ) {}

  ngOnInit(): void {
    this.timeLogFilterService.filteredLogs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(logs => {
        console.log('Received filtered logs:', logs);
        this.allTimeLogs = logs;
        this.totalItems = logs.length;
        this.calculateTaskTotals();
        this.updatePaginatedData();
        this.loading = false;
      });

    this.timeLogFilterService.onFiltersReset$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetSorting();
      });

    this.routeSub = this.projectContextService.currentProjectId$.subscribe(projectId => {
      this.projectId = projectId;
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


  openLinkDialog(log: any): void {
    this.selectedTimeLog = log;
    this.selectedTaskId = null;
    this.loadAssignedTasks();
    this.showLinkDialog = true;
  }

  loadAssignedTasks(): void {
    if (!this.projectId) return;

    this.timeLogService.getIncompleteTasks(this.projectId).subscribe({
      next: (tasks) => {
        this.assignedTasks = tasks;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      }
    });
  }

  linkToTask(taskId: string | null): void {
    if (!this.selectedTimeLog || !taskId) return;

    this.loading = true;

    this.timeLogService.linkTimeLogToTask(this.selectedTimeLog.id, taskId).subscribe({
      next: (updatedLog) => {
        const task = this.assignedTasks.find(t => t.id === taskId);
        this.selectedTimeLog.task = task || null;
        this.showLinkDialog = false;
        this.updatePaginatedData();
        this.loading = false;


      },
      error: (error) => {
        this.loading = false;
        let errorMessage = 'Failed to link time log';

        if (error.status === 403) {
          errorMessage = 'You are not assigned to this task';
        } else if (error.status === 409) {
          errorMessage = 'This time log is already linked to a task';
        } else if (error.status === 404) {
          errorMessage = 'Task or time log not found';
        }

      }
    });
  }

  editDescription(log: any): void {
    const newDescription = prompt('Edit description:', log.description);
    if (newDescription !== null && newDescription !== log.description) {
      this.loading = true;
      this.timeLogService.updateTimeLogDescription(log.id, newDescription).subscribe({
        next: (updatedLog) => {
          log.description = updatedLog.description;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  deleteTimeLog(log: any): void {
    if (confirm('Are you sure you want to delete this time log?')) {
      this.loading = true;
      this.timeLogService.deleteTimeLog(log.id).subscribe({
        next: () => {
          this.allTimeLogs = this.allTimeLogs.filter(l => l.id !== log.id);
          this.totalItems = this.allTimeLogs.length;
          this.updatePaginatedData();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  openEditDialog(log: any): void {
    this.selectedTimeLog = log;
    this.editDescriptionText = log.description || '';
    this.showEditDialog = true;
  }

  saveDescription(): void {
    if (!this.selectedTimeLog || !this.editDescriptionText) return;

    this.loading = true;
    this.timeLogService.updateTimeLogDescription(this.selectedTimeLog.id, this.editDescriptionText).subscribe({
      next: (updatedLog) => {
        this.selectedTimeLog.description = updatedLog.description;
        this.showEditDialog = false;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.applySorting();
  }

  getSortIndicator(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? '▲' : '▼';
    }
    return '';
  }

  private applySorting(): void {
    if (!this.sortColumn) return;

    this.allTimeLogs.sort((a, b) => {
      const valueA = this.getSortableValue(a, this.sortColumn);
      const valueB = this.getSortableValue(b, this.sortColumn);

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      } else if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });

    this.updatePaginatedData();
  }

  private getSortableValue(log: any, column: string): any {
    switch (column) {
      case 'startedAt':
        return new Date(log.startTime).getTime();
      case 'endedAt':
        return new Date(log.endTime).getTime();
      case 'duration':
        return (new Date(log.endTime).getTime() - new Date(log.startTime).getTime());
      case 'description':
        return log.description?.toLowerCase() || '';
      case 'task':
        return this.getTaskName(log).toLowerCase();
      default:
        return '';
    }
  }

  resetSorting(): void {
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.updatePaginatedData();
  }
}
