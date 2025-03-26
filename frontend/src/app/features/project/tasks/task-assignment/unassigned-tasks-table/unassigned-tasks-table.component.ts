import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {Observable, of, switchMap} from 'rxjs';
import {TaskAssignmentService} from '../../../../../services/project-tasks/task-assignment.service';

@Component({
  selector: 'app-unassigned-tasks-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './unassigned-tasks-table.component.html',
  styleUrls: ['./unassigned-tasks-table.component.scss']
})
export class UnassignedTasksTableComponent implements OnInit {
  unassignedTasks$: Observable<any[]> = of([]);
  loading = true;
  displayedColumns: string[] = ['name', 'description', 'deadline', 'createdAt'];

  constructor(private taskAssignmentService: TaskAssignmentService) {}

  ngOnInit(): void {
    this.loadUnassignedTasks();
  }

  loadUnassignedTasks(): void {
    this.loading = true;
    this.unassignedTasks$ = this.taskAssignmentService.projectId$.pipe(
      switchMap(projectId =>
        this.taskAssignmentService.getUnassignedPendingTasks(projectId)
      )
    );
    this.loading = false;
  }

  refreshTasks(): void {
    this.loadUnassignedTasks();
  }
}
