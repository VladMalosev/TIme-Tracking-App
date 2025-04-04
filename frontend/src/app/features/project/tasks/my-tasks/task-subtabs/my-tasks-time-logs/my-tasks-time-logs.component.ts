import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatOption } from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import {of, Subscription, switchMap, take} from 'rxjs';
import { TimeLogService } from '../../../../../../services/my-tasks/time-log.service';
import { ProjectTimeLogListComponent } from './project-time-log-list/project-time-log-list.component';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { ProjectContextService } from '../../../../../../services/project-context.service';
import { MatSelect } from '@angular/material/select';
import {TimeLogFilterService} from '../../../../../../services/my-tasks/time-log-filter.service';
import {TimeEntryComponent} from './time-entry/time-entry.component';
import {TimeEntryStateService} from '../../../../../../services/my-tasks/time-entry-state.service';

@Component({
  selector: 'app-my-tasks-time-logs',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelect,
    MatOption,
    ProjectTimeLogListComponent,
    TimeEntryComponent,
  ],
  templateUrl: './my-tasks-time-logs.component.html',
  styleUrls: ['./my-tasks-time-logs.component.scss']
})
export class MyTasksTimeLogsComponent implements OnInit, OnDestroy {
  projectId: string | null = null;
  private routeSub?: Subscription;
  private userSub?: Subscription;

  loading = false;
  isRunning = false;
  elapsedTime = 0;
  timerInterval: any;
  description = '';
  errorMessage: string | null = null;

  manualStartTime: string = '';
  manualEndTime: string = '';
  manualDescription: string = '';
  manualTimeError: string | null = null;
  selectedTaskId: string | null = null;
  incompleteTasks: any[] = [];
  tasksLoading = false;

  showFilters = false;
  timeLogs: any[] = [];
  filteredLogs: any[] = [];

  userId: string | null = null;

  private _descriptionFilter = '';
  private _taskFilter = '';
  private _dateFrom: Date | null = null;
  private _dateTo: Date | null = null;

  set descriptionFilter(value: string) {
    this._descriptionFilter = value;
    this.applyFilters();
  }
  get descriptionFilter(): string {
    return this._descriptionFilter;
  }

  set taskFilter(value: string) {
    this._taskFilter = value;
    this.applyFilters();
  }
  get taskFilter(): string {
    return this._taskFilter;
  }

  set dateFrom(value: Date | null) {
    this._dateFrom = value;
    this.applyFilters();
  }
  get dateFrom(): Date | null {
    return this._dateFrom;
  }

  set dateTo(value: Date | null) {
    this._dateTo = value;
    this.applyFilters();
  }
  get dateTo(): Date | null {
    return this._dateTo;
  }


  constructor(
    private timeLogService: TimeLogService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private projectContextService: ProjectContextService,
    private timeEntryState: TimeEntryStateService,
    private timeLogFilterService: TimeLogFilterService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.projectId = params.get('id');
      if (this.projectId) {
        this.timeEntryState.setProjectId(this.projectId);
        this.projectContextService.setCurrentProjectId(this.projectId);

        this.userSub = this.authService.userId$.pipe(
          take(1),
          switchMap(userId => {
            if (!userId) return of(null);
            this.userId = userId;
            this.timeEntryState.setUserId(userId);
            return of(undefined);
          })
        ).subscribe({
          next: () => {
            this.loadIncompleteTasks();
            this.loadTimeLogs();
          },
          error: (error) => {
            console.error('Error initializing time logs:', error);
          }
        });

        this.authService.getUserId();
      }
    });
  }
  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.stopTimer();
  }

  private checkActiveTimer(): void {
    if (!this.projectId || !this.userId) return;

    this.timeLogService.getActiveProjectTimer(this.projectId).subscribe({
      next: (timeLog) => {
        if (timeLog) {
          const startTime = new Date(timeLog.startTime);
          this.elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
          this.isRunning = true;
          this.timerInterval = setInterval(() => {
            this.elapsedTime++;
          }, 1000);
        }
      },
      error: (error) => {
        console.error('Error checking active timer:', error);
      }
    });
  }


  toggleFilters(): void {
    this.showFilters = !this.showFilters;
    if (!this.showFilters) {
      this.resetFilters();
    }
  }

  resetFilters(): void {
    this.descriptionFilter = '';
    this.taskFilter = '';
    this.dateFrom = null;
    this.dateTo = null;
    this.applyFilters();

    this.timeLogFilterService.notifyFiltersReset();
  }

  applyFilters(): void {
    this.filteredLogs = this.timeLogs.filter(log => {
      if (this.descriptionFilter &&
        !log.description.toLowerCase().includes(this.descriptionFilter.toLowerCase())) {
        return false;
      }

      if (this.taskFilter && (!log.task || log.task.id !== this.taskFilter)) {
        return false;
      }

      const logDate = new Date(log.startTime);

      if (this.dateFrom && logDate < this.dateFrom) {
        return false;
      }

      if (this.dateTo) {
        const toDate = new Date(this.dateTo);
        toDate.setDate(toDate.getDate() + 1);
        if (logDate > toDate) {
          return false;
        }
      }

      return true;
    });

    this.timeLogFilterService.updateFilteredLogs(this.filteredLogs);
  }

  loadTimeLogs(): void {
    if (!this.projectId) return;

    this.loading = true;
    this.timeLogService.getProjectTimeLogs(this.projectId).subscribe({
      next: (logs) => {
        this.timeLogs = logs;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading time logs:', error);
        this.errorMessage = 'Failed to load time logs';
        this.loading = false;
      }
    });
  }


  stopTimer(): void {
    if (this.isRunning && this.projectId) {
      this.isRunning = false;
      clearInterval(this.timerInterval);

      this.timeLogService.stopProjectTimer(this.projectId).subscribe({
        next: () => {
          console.log('Project timer stopped');
          this.elapsedTime = 0;
          this.loadTimeLogs();
        },
        error: (error) => {
          console.error('Error stopping project timer:', error);
          this.errorMessage = 'Failed to stop timer';
          this.isRunning = true;
          const startTime = new Date(new Date().getTime() - this.elapsedTime * 1000);
          this.timerInterval = setInterval(() => {
            this.elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
          }, 1000);
        }
      });
    }
  }

  createManualTimeLog(): void {
    if (!this.manualStartTime || !this.manualEndTime) {
      this.manualTimeError = 'Start time and end time are required';
      return;
    }

    const startTime = this.formatForBackend(this.manualStartTime);
    const endTime = this.formatForBackend(this.manualEndTime);

    if (new Date(startTime) >= new Date(endTime)) {
      this.manualTimeError = 'End time must be after start time';
      return;
    }

    if (!this.projectId) {
      this.manualTimeError = 'Project ID is missing';
      return;
    }

    this.timeLogService.createManualProjectTimeLog(
      this.projectId,
      startTime,
      endTime,
      this.manualDescription,
      this.selectedTaskId || undefined
    ).subscribe({
      next: () => {
        console.log('Manual project time log created');
        this.manualTimeError = null;
        this.manualStartTime = '';
        this.manualEndTime = '';
        this.manualDescription = '';
        this.selectedTaskId = null;
      },
      error: (error) => {
        console.error('Error creating manual project time log:', error);
        this.manualTimeError = 'Failed to create manual time log';
      }
    });
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private formatForBackend(datetime: string): string {
    if (datetime.length === 16) {
      return `${datetime}:00.000`;
    }
    return datetime;
  }

  loadIncompleteTasks(): void {
    if (!this.projectId || !this.userId) {
      console.warn('Cannot load tasks - missing projectId or userId');
      return;
    }

    this.timeEntryState.setTasksLoading(true);
    this.timeLogService.getIncompleteTasks(this.projectId).subscribe({
      next: (tasks) => {
        console.log('Loaded tasks:', tasks);
        this.incompleteTasks = tasks;
        this.timeEntryState.setIncompleteTasks(tasks);
        this.timeEntryState.setTasksLoading(false);
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.timeEntryState.setTasksLoading(false);
      }
    });
  }


}
