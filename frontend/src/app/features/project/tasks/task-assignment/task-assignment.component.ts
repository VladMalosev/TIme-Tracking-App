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
import {TaskAssignmentService} from '../../../../services/project-tasks/task-assignment.service';
import {MatDivider} from '@angular/material/divider';
import {MatIcon} from '@angular/material/icon';
import {UnassignedTasksTableComponent} from './unassigned-tasks-table/unassigned-tasks-table.component';

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
    MatDivider,
    MatIcon,
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

  ngOnInit(): void {}

  get canAssignTasks$(): Observable<boolean> {
    return this.taskAssignmentService.currentUserRole$.pipe(
      map(role => {
        const allowedRoles = ['ADMIN', 'OWNER', 'MANAGER'];
        return allowedRoles.includes(role);
      })
    );
  }

  get tasks$() {
    return this.taskAssignmentService.tasks$;
  }

  get collaborators$() {
    return this.taskAssignmentService.collaborators$;
  }

  get selectedTask$() {
    return this.taskAssignmentService.selectedTask$;
  }

  get selectedUser$() {
    return this.taskAssignmentService.selectedUser$;
  }

  onTaskSelected(task: any): void {
    this.taskAssignmentService.setSelectedTask(task);
  }

  onUserSelected(user: any): void {
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
        if (!task || !user) {
          this.errorMessage = 'Please select a task and a user.';
          return EMPTY;
        }

        return this.taskAssignmentService.assignTask(
          task.id,
          user.user.id,
          userId
        );
      })
    ).subscribe({
      next: () => {
        this.snackBar.open('Task assigned successfully!', 'Close', { duration: 3000 });
        this.errorMessage = null;
        this.taskAssignmentService.setSelectedTask(null);
        this.taskAssignmentService.setSelectedUser(null);
      },
      error: (error) => {
        console.error('Error assigning task', error);
        this.errorMessage = 'Failed to assign task.';
      }
    });
  }
}
