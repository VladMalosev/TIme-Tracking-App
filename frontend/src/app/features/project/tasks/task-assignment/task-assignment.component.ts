import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {EMPTY, map, Observable, switchMap, take, withLatestFrom} from 'rxjs';
import { TaskAssignmentService } from '../../../../services/project-tasks/task-assignment.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { UnassignedTasksTableComponent } from './unassigned-tasks-table/unassigned-tasks-table.component';

interface Task {
  id: string;
  name: string;
  status: string;
}

interface User {
  id: string;
  name: string;
}

interface Collaborator {
  user: User;
}

@Component({
  selector: 'app-task-assignment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDividerModule,
    MatIconModule,
    UnassignedTasksTableComponent
  ],
  templateUrl: './task-assignment.component.html',
  styleUrls: ['./task-assignment.component.scss']
})
export class TaskAssignmentComponent implements OnInit {
  errorMessage: string | null = null;

  constructor(
    private taskAssignmentService: TaskAssignmentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUnassignedTasks();
  }

  private loadUnassignedTasks(): void {
    this.taskAssignmentService.projectId$.pipe(
      take(1),
      switchMap(projectId => {
        if (!projectId) {
          this.errorMessage = 'No project selected';
          return EMPTY;
        }
        return this.taskAssignmentService.getUnassignedPendingTasks(projectId);
      })
    ).subscribe({
      next: (tasks: Task[]) => this.taskAssignmentService.setTasks(tasks),
      error: (error) => {
        console.error('Error loading unassigned tasks', error);
        this.errorMessage = 'Failed to load unassigned tasks';
      }
    });
  }

  get canAssignTasks$(): Observable<boolean> {
    return this.taskAssignmentService.currentUserRole$.pipe(
      map((role: string | undefined) => {
        const allowedRoles = ['ADMIN', 'OWNER', 'MANAGER'];
        return role ? allowedRoles.includes(role) : false;
      })
    );
  }

  get tasks$(): Observable<Task[]> {
    return this.taskAssignmentService.tasks$;
  }

  get collaborators$(): Observable<Collaborator[]> {
    return this.taskAssignmentService.collaborators$;
  }

  get selectedTask$(): Observable<Task | null> {
    return this.taskAssignmentService.selectedTask$;
  }

  get selectedUser$(): Observable<Collaborator | null> {
    return this.taskAssignmentService.selectedUser$;
  }

  onTaskSelected(task: Task): void {
    this.taskAssignmentService.setSelectedTask(task);
  }

  onUserSelected(user: Collaborator): void {
    this.taskAssignmentService.setSelectedUser(user);
  }

  assignTask(): void {
    this.taskAssignmentService.selectedTask$.pipe(
      take(1),
      withLatestFrom(
        this.taskAssignmentService.selectedUser$,
        this.taskAssignmentService.userId$
      ),
      switchMap(([task, user, userId]) => {
        if (!task || !user?.user?.id || !userId) {
          this.errorMessage = 'Please select both a task and a user';
          return EMPTY;
        }

        return this.taskAssignmentService.assignTask(
          task.id,
          user.user.id,
          userId
        );
      }),
      switchMap(() => this.taskAssignmentService.projectId$),
      take(1)
    ).subscribe({
      next: (projectId: string | undefined) => {
        if (projectId) {
          this.showSuccessMessage();
          this.resetForm();
          this.loadUnassignedTasks();
        }
      },
      error: (error) => {
        console.error('Error assigning task', error);
        this.errorMessage = 'Failed to assign task. Please try again.';
      }
    });
  }

  private showSuccessMessage(): void {
    this.snackBar.open('Task assigned successfully!', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private resetForm(): void {
    this.errorMessage = null;
    this.taskAssignmentService.setSelectedTask(null);
    this.taskAssignmentService.setSelectedUser(null);
  }
}
