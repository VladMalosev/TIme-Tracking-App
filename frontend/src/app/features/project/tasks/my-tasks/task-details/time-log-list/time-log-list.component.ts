import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatTooltipModule
  ],
  templateUrl: './time-log-list.component.html',
  styleUrls: ['./time-log-list.component.scss']
})
export class TimeLogListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['startTime', 'endTime', 'duration', 'description'];
  timeLogs: any[] = [];
  loading = false;
  private taskSubscription!: Subscription;
  private refreshSubscription!: Subscription;

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

  loadTimeLogs(taskId: string): void {
    console.log('Loading logs for task:', taskId);
    this.loading = true;
    this.timeLogService.getTimeLogsByTask(taskId).subscribe({
      next: (logs) => {
        console.log('Received logs:', logs);
        this.timeLogs = logs.map(log => ({
          ...log,
          duration: this.calculateDuration(log.startTime, log.endTime)
        }));
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
}
