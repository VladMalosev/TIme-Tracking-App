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
import {MatNativeDateModule, MatOption} from '@angular/material/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import {TimeLogService} from '../../../../../../services/my-tasks/time-log.service';
import {ProjectTimeLogListComponent} from './project-time-log-list/project-time-log-list.component';
import {AuthService} from '../../../../../../core/auth/auth.service';
import {ProjectContextService} from '../../../../../../services/project-context.service';
import {MatSelect} from '@angular/material/select';

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
    ProjectTimeLogListComponent,
    MatSelect,
    MatOption,
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

  userId: string | null = null;

  constructor(
    private timeLogService: TimeLogService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private projectContextService: ProjectContextService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.projectId = params.get('id');
      if (this.projectId) {
        this.projectContextService.setCurrentProjectId(this.projectId);

        this.userSub = this.authService.userId$.subscribe(userId => {
          if (userId) {
            this.userId = userId;
            this.loadIncompleteTasks();
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

  startTimer(): void {
    if (!this.isRunning && this.projectId) {
      const startTime = new Date();

      this.timeLogService.startProjectTimer(
        this.projectId,
        this.description,
        this.selectedTaskId || undefined
      ).subscribe({
        next: () => {
          console.log('Project timer started');

          this.isRunning = true;
          this.timerInterval = setInterval(() => {
            this.elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
          }, 1000);

        },
        error: (error) => {
          console.error('Error starting project timer:', error);
          this.errorMessage = error.message || 'Failed to start timer';
          this.elapsedTime = 0;
        }
      });
    }
  }


  stopTimer(): void {
    if (this.isRunning && this.projectId) {
      this.isRunning = false;
      clearInterval(this.timerInterval);

      this.timeLogService.stopProjectTimer(this.projectId).subscribe({
        next: () => {
          console.log('Project timer stopped');
          this.elapsedTime = 0;
        },
        error: (error) => {
          console.error('Error stopping project timer:', error);
          this.errorMessage = 'Failed to stop timer';
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

    this.tasksLoading = true;
    this.timeLogService.getIncompleteTasks(this.projectId).subscribe({
      next: (tasks) => {
        console.log('Loaded tasks:', tasks);
        this.incompleteTasks = tasks;
        this.tasksLoading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.tasksLoading = false;
      }
    });
  }


}
