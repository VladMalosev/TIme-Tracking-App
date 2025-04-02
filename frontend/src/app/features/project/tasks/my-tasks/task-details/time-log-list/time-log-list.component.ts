import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { TimeLogService } from '../../../../../../services/my-tasks/time-log.service';
import { TaskSelectionService } from '../../../../../../services/my-tasks/task-selection.service';

@Component({
  selector: 'app-time-log-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './time-log-list.component.html',
  styleUrls: ['./time-log-list.component.scss']
})
export class TimeLogListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['startTime', 'endTime', 'duration', 'description'];
  timeLogs: any[] = [];
  loading = false;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  private taskSubscription!: Subscription;
  private refreshSubscription!: Subscription;
  showEditDialog = false;
  editDescriptionText = '';
  selectedTimeLog: any = null;


  constructor(
    private timeLogService: TimeLogService,
    private taskSelectionService: TaskSelectionService
  ) {}

  ngOnInit(): void {
    this.taskSubscription = this.taskSelectionService.selectedTaskId$.subscribe(taskId => {
      console.log('Task ID changed:', taskId);
      if (taskId) {
        this.loadTimeLogs(taskId);
      } else {
        this.timeLogs = [];
      }
    });

    this.refreshSubscription = this.taskSelectionService.refreshTimeLogs$.subscribe(() => {
      console.log('Refresh event received');
      const taskId = this.taskSelectionService.getCurrentTaskId();
      if (taskId) {
        console.log('Refreshing logs for task:', taskId);
        this.loadTimeLogs(taskId);
      }
    });
  }

  ngOnDestroy(): void {
    this.taskSubscription?.unsubscribe();
    this.refreshSubscription?.unsubscribe();
  }

  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortLogs();
  }

  private sortLogs(): void {
    if (!this.sortColumn) return;

    this.timeLogs.sort((a, b) => {
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
  }

  private getSortableValue(log: any, column: string): any {
    switch(column) {
      case 'startTime': return log.startTimeValue;
      case 'endTime': return log.endTimeValue;
      case 'duration': return log.durationValue;
      case 'description': return log.description?.toLowerCase() || '';
      case 'task': return log.task?.name?.toLowerCase() || '';
      default: return '';
    }
  }

  private getDurationInMinutes(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return (end.getTime() - start.getTime()) / (1000 * 60);
  }

  getSortIndicator(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? '▲' : '▼';
    }
    return '';
  }

  loadTimeLogs(taskId: string): void {
    console.log('Loading logs for task:', taskId);
    this.loading = true;
    this.timeLogService.getTimeLogsByTask(taskId).subscribe({
      next: (logs) => {
        console.log('Received logs:', logs);
        this.timeLogs = logs.map(log => ({
          ...log,
          duration: this.calculateDuration(log.startTime, log.endTime),
          startTimeValue: new Date(log.startTime).getTime(),
          endTimeValue: new Date(log.endTime).getTime(),
          durationValue: this.getDurationInMinutes(log.startTime, log.endTime)
        }));
        this.sortLogs();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading logs:', error);
        this.loading = false;
        this.timeLogs = [];
      }
    });
  }



  calculateDuration(startTime: string, endTime: string): string {
    if (!startTime || !endTime) return 'N/A';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }

  refreshLogs(): void {
    console.log('Manual refresh triggered');
    this.taskSelectionService.triggerTimeLogsRefresh();
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

  deleteTimeLog(log: any): void {
    if (confirm('Are you sure you want to delete this time log?')) {
      this.loading = true;
      this.timeLogService.deleteTimeLog(log.id).subscribe({
        next: () => {
          this.timeLogs = this.timeLogs.filter(l => l.id !== log.id);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }
}
