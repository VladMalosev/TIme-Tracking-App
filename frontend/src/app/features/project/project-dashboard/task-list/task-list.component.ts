import {Component, OnDestroy} from '@angular/core';
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
import {TimeTrackingService} from '../../../../services/time-tracking.service';
import {Subscription} from 'rxjs';
import {TimeEntryStateService} from '../../../../services/my-tasks/time-entry-state.service';

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
export class TaskListComponent implements OnDestroy {
  taskDurations: { [key: string]: string } = {};
  pageSize = 3;
  pageIndex = 0;
  pageSizeOptions = [3, 5, 7];
  tasks: any[] = [];
  runningTimers: Set<string> = new Set();
  private timerSubscriptions: Subscription[] = [];
  private timeEntryStateSubscription: Subscription;

  constructor(
    public taskListService: TaskListService,
    private timeLogService: TimeLogService,
    private router: Router,
    private projectContextService: ProjectContextService,
    private timeTrackingService: TimeTrackingService,
    private timeEntryState: TimeEntryStateService
  ) {
    this.taskListService.tasks$.subscribe(tasks => {
      this.tasks = tasks || [];
      this.checkRunningTimers();
    });

    this.timeEntryStateSubscription = this.timeEntryState.timerStopped$.subscribe(timerId => {
      this.runningTimers.delete(timerId);

      this.taskDurations[timerId] = 'Loading...';
      this.timeLogService.getTimeLogsByTask(timerId).subscribe(logs => {
        this.taskDurations[timerId] = this.calculateDuration(logs);
      });

      this.taskListService.refreshTasks();
    });
  }

  private syncTimerState(taskId: string): void {
    this.timeTrackingService.getActiveTimeLog(taskId).subscribe({
      next: (timeLog) => {
        if (!timeLog) {
          this.runningTimers.delete(taskId);
        } else {
          this.runningTimers.add(taskId);
        }
        this.taskDurations[taskId] = 'Loading...';
        this.timeLogService.getTimeLogsByTask(taskId).subscribe(logs => {
          this.taskDurations[taskId] = this.calculateDuration(logs);
        });
      },
      error: (error) => {
        console.error('Error syncing timer state:', error);
        this.runningTimers.delete(taskId);
      }
    });
  }

  ngOnDestroy(): void {
    this.timerSubscriptions.forEach(sub => sub.unsubscribe());
    this.timeEntryStateSubscription?.unsubscribe();
  }

  checkRunningTimers(): void {
    this.timerSubscriptions.forEach(sub => sub.unsubscribe());
    this.timerSubscriptions = [];

    this.tasks.forEach(task => {
      const sub = this.timeTrackingService.getActiveTimeLog(task.id).subscribe({
        next: (timelog) => {
          if (timelog) {
            this.runningTimers.add(task.id);
          } else {
            this.runningTimers.delete(task.id);
          }
        },
        error: (err) => {
          console.error('Error checking timer status for task', task.id, err);
        }
      });
      this.timerSubscriptions.push(sub);
    });
  }


  isTaskTimerRunning(taskId: string): boolean {
    return this.runningTimers.has(taskId);
  }

  onToggleTimer(task: any): void {
    if (this.isTaskTimerRunning(task.id)) {
      this.stopTimer(task);
    } else {
      this.startTimer(task);
    }
  }

  startTimer(task: any): void {
    const projectId = this.projectContextService.getCurrentProjectId();
    if (!projectId) return;

    this.timeTrackingService.startTimeLog(
      projectId,
      task.id,
      `Working on ${task.name}`
    ).subscribe({
      next: () => {
        this.runningTimers.add(task.id);
        if (task.status === 'PENDING' || task.status === 'ASSIGNED') {
          task.status = 'IN_PROGRESS';
        }
      },
      error: (err) => {
        console.error('Error starting timer', err);
      }
    });
  }

  stopTimer(task: any): void {
    if (!this.isTaskTimerRunning(task.id)) {
      return;
    }

    const previousState = this.runningTimers.has(task.id);
    this.runningTimers.delete(task.id);

    this.timeTrackingService.stopTimeLog(task.id).subscribe({
      next: () => {
        this.timeEntryState.notifyTimerStopped(task.id);
        this.taskDurations[task.id] = 'Loading...';
        this.timeLogService.getTimeLogsByTask(task.id).subscribe(logs => {
          this.taskDurations[task.id] = this.calculateDuration(logs);
        });
      },
      error: (err) => {
        console.error('Error stopping timer', err);
        if (err?.error === "No active timer found") {
          this.timeEntryState.notifyTimerStopped(task.id);
          this.taskDurations[task.id] = 'Loading...';
          this.timeLogService.getTimeLogsByTask(task.id).subscribe(logs => {
            this.taskDurations[task.id] = this.calculateDuration(logs);
          });
        } else {
          if (previousState) {
            this.runningTimers.add(task.id);
          }
          this.syncTimerState(task.id);
        }
      }
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
