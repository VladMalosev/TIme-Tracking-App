import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import {Subject, takeUntil, interval, switchMap, of, take, Observable} from 'rxjs';
import { TimeLogService } from '../../../services/my-tasks/time-log.service';
import { ProjectContextService } from '../../../services/project-context.service';
import { MatIcon } from '@angular/material/icon';
import {AsyncPipe, DatePipe, NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import { TimeEntryStateService } from '../../../services/my-tasks/time-entry-state.service';
import { Router } from '@angular/router';
import {MatFormField, MatLabel, MatOption, MatSelect, MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {AuthService} from '../../../core/auth/auth.service';

@Component({
  selector: 'app-timer-widget',
  templateUrl: './timer-widget.component.html',
  imports: [
    MatIcon,
    NgForOf,
    NgIf,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    DatePipe,
    TitleCasePipe,
    AsyncPipe,
  ],
  styleUrls: ['./timer-widget.component.scss']
})
export class TimerWidgetComponent implements OnInit, OnDestroy {
  activeTimers: any[] = [];
  collapsed = true;
  private destroy$ = new Subject<void>();
  private refreshInterval = 1000;

  projects: any[] = [];
  tasks: any[] = [];
  selectedProject: any = null;
  selectedTask: any = null;
  timerDescription = '';
  recentTasks: any[] = [];
  errorMessage: string | null = null;
  selectedTaskId: string | null = null;
  taskTimeLogs: any[] = [];
  isLoadingTimeLogs = false;
  isNewTimerExpanded = false;
  isAuthenticated$: Observable<boolean>;

  constructor(
    private timeLogService: TimeLogService,
    private projectContextService: ProjectContextService,
    private timeEntryState: TimeEntryStateService,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.isAuthenticated$ = this.authService.isLoggedIn$;
  }

  ngOnInit(): void {
    this.authService.isLoggedIn$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.initializeWidget();
      } else {
        this.cleanupWidget();
      }
    });

    this.timeEntryState.timerStopped$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.authService.isLoggedIn$) {
        this.loadActiveTimers();
      }
    });
  }

  private initializeWidget(): void {
    this.loadActiveTimers();
    this.fetchProjects();
    this.loadRecentTasks();

    interval(this.refreshInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.authService.isLoggedIn$) {
          this.loadActiveTimers();
        }
      });
  }

  private cleanupWidget(): void {
    this.activeTimers = [];
    this.projects = [];
    this.recentTasks = [];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchProjects(): void {
    this.http.get<any>('http://localhost:8080/api/projects', { withCredentials: true }).subscribe({
      next: (response) => {
        this.projects = response.projects || [];
      },
      error: (error) => {
        console.error('Error fetching projects:', error);
      }
    });
  }

  onProjectSelected(): void {
    if (this.selectedProject) {
      this.fetchTasks(this.selectedProject.id);
    } else {
      this.tasks = [];
      this.selectedTask = null;
    }
  }

  fetchTasks(projectId: string): void {
    this.http.get<any>(`http://localhost:8080/api/tasks/project/${projectId}`, { withCredentials: true }).subscribe({
      next: (response) => {
        this.tasks = Array.isArray(response) ? response : response.tasks || [];
        this.selectedTask = null;
      },
      error: (error) => {
        console.error('Error fetching tasks:', error);
      }
    });
  }


  loadRecentTasks(): void {
    this.timeLogService.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) return of([]);
        return this.timeLogService.getRecentTasks(userId, 5);
      })
    ).subscribe({
      next: (tasks) => {
        this.recentTasks = tasks.map(taskInfo => {
          const taskWithProjectId = {
            ...taskInfo.task,
            projectId: taskInfo.projectId
          };

          return {
            ...taskInfo,
            project: this.projects.find(p => p.id === taskInfo.projectId),
            task: taskWithProjectId
          };
        });
        console.log('Recent tasks loaded:', this.recentTasks);
      },
      error: (err) => console.error('Error loading recent tasks:', err)
    });
  }

  startTimerForRecentTask(taskInfo: any): void {
    const task = taskInfo.task ? taskInfo.task : taskInfo;

    this.timeLogService.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }

        console.log('Starting timer for task:', task);

        const projectId = task.project?.id;
        if (!projectId) {
          throw new Error(`Project ID is missing from the task. Task object: ${JSON.stringify(task)}`);
        }

        this.selectedProject = this.projects.find(p => p.id === projectId);
        this.selectedTask = task;
        this.timerDescription = '';

        return this.timeLogService.startProjectTimer(
          projectId,
          this.timerDescription,
          task.id
        );
      })
    ).subscribe({
      next: () => {
        this.errorMessage = null;
        this.loadActiveTimers();
      },
      error: (error) => {
        console.error('Error starting timer:', error);
        this.errorMessage = error.message || 'Failed to start timer';
      }
    });
  }

  startNewTimer(): void {
    if (!this.selectedProject) {
      this.errorMessage = 'Please select both a project and task';
      return;
    }

    this.timeLogService.startProjectTimer(
      this.selectedProject.id,
      this.timerDescription,
      this.selectedTask?.id
    ).subscribe({
      next: () => {
        this.errorMessage = null;
        this.loadActiveTimers();
        this.timerDescription = '';
      },
      error: (error) => {
        console.error('Error starting timer:', error);
        this.errorMessage = error.error?.message || 'Failed to start timer';
      }
    });
  }

  toggleNewTimerExpand(): void {
    this.isNewTimerExpanded = !this.isNewTimerExpanded;
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
  }

  loadActiveTimers(): void {
    this.timeLogService.getActiveTimers().subscribe({
      next: (timers) => {
        this.activeTimers = timers.map(timer => ({
          ...timer,
          currentDuration: this.calculateCurrentDuration(timer)
        }));
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403 || err.status === 500) {
          this.activeTimers = [];
        } else {
          console.error('Error loading active timers:', err);
        }
      }
    });
  }

  calculateCurrentDuration(timer: any): string {
    if (!timer.startTime) return '0h 0m';

    const start = new Date(timer.startTime);
    const end = timer.endTime ? new Date(timer.endTime) : new Date();
    const duration = (end.getTime() - start.getTime()) / 1000;

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  stopTimer(timerId: string): void {
    this.timeLogService.stopTimer(timerId).subscribe({
      next: () => {
        this.loadActiveTimers();
        this.timeEntryState.notifyTimerStopped(timerId);
      },
      error: (err) => console.error('Error stopping timer:', err)
    });
  }

  getProjectName(timer: any): string {
    return timer.project?.name || 'No project';
  }

  getTaskName(timer: any): string {
    return timer.task?.name || 'No task';
  }

  goToTask(timer: any): void {
    const taskId = timer.task?.id;
    const projectId = timer.project?.id;

    if (taskId && projectId || projectId) {
      this.router.navigate([`/project-details/${projectId}/dashboard`], {
        queryParams: { tab: 'tasks', subTab: 'time-logs' }
      });
    }
  }

  goToProject(timer: any): void {
    const projectId = timer.project?.id;
    if (projectId) {
      this.router.navigate([`/project-details/${projectId}/dashboard`]);
    } else {
      console.warn('No project info available for navigation.');
    }
  }

  formatMinutes(minutes: number): string {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  viewTaskTimeLogs(task: any): void {
    if (this.selectedTaskId === task.id) {
      this.selectedTaskId = null;
      this.taskTimeLogs = [];
      return;
    }

    this.selectedTaskId = task.id;
    this.isLoadingTimeLogs = true;

    this.timeLogService.getTimeLogsByTask(task.id).subscribe({
      next: (logs) => {
        this.taskTimeLogs = logs;
        this.isLoadingTimeLogs = false;
      },
      error: (err) => {
        console.error('Error loading task time logs:', err);
        this.isLoadingTimeLogs = false;
      }
    });
  }

  startLogEdit(log: any): void {
    log.editing = true;
    log.editDescription = log.description;
  }

  cancelLogEdit(log: any): void {
    log.editing = false;
  }

  saveLogEdit(log: any): void {
    if (!log.editDescription) return;

    this.timeLogService.updateTimeLogDescription(log.id, log.editDescription)
      .subscribe({
        next: (updatedLog) => {
          log.description = updatedLog.description;
          log.editing = false;
        },
        error: (err) => {
          console.error('Error updating time log description:', err);
        }
      });
  }



  deleteTimeLog(logId: string): void {
    if (confirm('Are you sure you want to delete this time log?')) {
      this.timeLogService.deleteTimeLog(logId).subscribe({
        next: () => {
          this.taskTimeLogs = this.taskTimeLogs.filter(log => log.id !== logId);
        },
        error: (err) => {
          console.error('Error deleting time log:', err);
        }
      });
    }
  }


  formatDateShort(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  formatDuration(startTime: string, endTime: string): string {
    if (!startTime) return '0m';

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}
