import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { ProjectContextService } from '../../../../../../services/project-context.service';
import { MatDivider } from '@angular/material/divider';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-my-tasks-create-task',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDivider,
    MatProgressSpinner
  ],
  templateUrl: './my-tasks-create-task.component.html',
  styleUrls: ['./my-tasks-create-task.component.scss']
})
export class MyTasksCreateTaskComponent implements OnInit, OnDestroy {
  taskName: string = '';
  taskDescription: string = '';
  taskDeadline: string = '';
  errorMessage: string | null = null;
  timeNotSelectedError: boolean = false;
  isLoading: boolean = false;
  userId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private projectContextService: ProjectContextService
  ) {}

  ngOnInit(): void {
    // Subscribe to userId changes
    this.authService.userId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(userId => {
        this.userId = userId;
        if (!userId) {
          this.errorMessage = 'Please log in to create tasks';
        } else {
          this.errorMessage = null;
        }
      });

    // Trigger initial userId fetch
    this.authService.getUserId();
  }

  validateDeadlineTime(deadlineValue: string): void {
    if (deadlineValue) {
      const date = new Date(deadlineValue);
      this.timeNotSelectedError = date.getHours() === 0 && date.getMinutes() === 0;
    } else {
      this.timeNotSelectedError = false;
    }
  }

  createTask(): void {
    if (!this.userId) {
      this.errorMessage = 'Please log in to create tasks';
      return;
    }

    if (this.timeNotSelectedError) {
      this.errorMessage = 'Please specify both date and time for the deadline';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const projectId = this.projectContextService.getCurrentProjectId();
    if (!projectId) {
      this.errorMessage = 'No project selected';
      this.isLoading = false;
      return;
    }
    const now = new Date().toISOString();

    const taskData = {
      name: this.taskName,
      description: this.taskDescription,
      status: 'PENDING',
      deadline: this.taskDeadline ? new Date(this.taskDeadline).toISOString() : null,
      assignedTo: { id: this.userId },
      assignedBy: { id: this.userId },
      assignedAt: now,
      createdBy: { id: this.userId },
      lastModifiedBy: { id: this.userId },
      createdAt: now,
      updatedAt: now
    };

    this.http.post<any>(
      `http://localhost:8080/api/tasks?projectId=${projectId}`,
      taskData,
      { withCredentials: true }
    ).subscribe({
      next: () => {
        this.resetForm();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating task', error);
        this.errorMessage = error.error?.message || 'Failed to create task';
        this.isLoading = false;
      }
    });
  }

  private resetForm(): void {
    this.taskName = '';
    this.taskDescription = '';
    this.taskDeadline = '';
    this.timeNotSelectedError = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
