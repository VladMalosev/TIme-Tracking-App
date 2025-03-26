import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { Observable, of, switchMap } from 'rxjs';
import { TaskAssignmentService } from '../../../../services/project-tasks/task-assignment.service';



@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatTabsModule,

  ],
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.scss']
})
export class MyTasksComponent implements OnInit {
  assignedTasks$: Observable<any[]> = of([]);
  loading = true;
  activeTabIndex = 0;
  displayedColumns: string[] = ['name', 'description', 'status', 'deadline', 'assignedBy', 'assignedDate', 'actions'];

  readonly TASK_STATUS = {
    PENDING: 'PENDING',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
  };

  constructor(private taskAssignmentService: TaskAssignmentService) {}

  ngOnInit(): void {
    this.loadAssignedTasks();
  }

  loadAssignedTasks(): void {
    this.loading = true;
    this.assignedTasks$ = this.taskAssignmentService.userId$.pipe(
      switchMap(userId => {
        if (!userId) return of([]);
        return this.taskAssignmentService.getAssignedTasks(userId);
      })
    );
    this.loading = false;
  }

  updateTaskStatus(taskId: string, newStatus: string): void {
    this.taskAssignmentService.updateTaskStatus(taskId, newStatus)
      .subscribe(() => this.loadAssignedTasks());
  }

  startTask(taskId: string): void {
    this.updateTaskStatus(taskId, this.TASK_STATUS.IN_PROGRESS);
  }

  completeTask(taskId: string): void {
    this.updateTaskStatus(taskId, this.TASK_STATUS.COMPLETED);
  }

  getStatusColor(status: string): string {
    switch(status) {
      case this.TASK_STATUS.PENDING: return 'warn';
      case this.TASK_STATUS.ASSIGNED: return 'primary';
      case this.TASK_STATUS.IN_PROGRESS: return 'accent';
      case this.TASK_STATUS.COMPLETED: return 'success';
      default: return '';
    }
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
  }
}
