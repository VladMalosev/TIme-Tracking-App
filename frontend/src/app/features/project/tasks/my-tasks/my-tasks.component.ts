import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Observable, of, switchMap, map } from 'rxjs';
import { TaskAssignmentService } from '../../../../services/project-tasks/task-assignment.service';
import { TaskSelectionService } from '../../../../services/my-tasks/task-selection.service';
import {TaskDetailsComponent} from './task-details/task-details.component';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    TaskDetailsComponent,
  ],
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.scss']
})
export class MyTasksComponent implements OnInit, OnDestroy {
  assignedTasks$: Observable<any[]> = of([]);
  filteredTasks$: Observable<any[]> = of([]);
  loading = true;
  expandedTaskId: string | null = null;
  showFilters = false;

  nameFilter = '';
  statusFilter = '';
  assignedByFilter = '';
  dateFrom: string | null = null;
  dateTo: string | null = null;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  readonly TASK_STATUS = {
    PENDING: 'PENDING',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    REOPENED: 'REOPENED'
  };

  statusOptions = Object.values(this.TASK_STATUS);

  constructor(
    private taskAssignmentService: TaskAssignmentService,
    private taskSelectionService: TaskSelectionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadAssignedTasks();

    this.route.queryParams.subscribe(params => {
      const taskIdFromUrl = params['taskId'];
      if (taskIdFromUrl) {
        this.expandedTaskId = taskIdFromUrl;
        this.taskSelectionService.setSelectedTaskId(taskIdFromUrl);
      }
    });
  }

  ngOnDestroy(): void {
    this.taskSelectionService.clearSelectedTaskId();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { taskId: null },
      queryParamsHandling: 'merge'
    });

    this.expandedTaskId = null;
  }

  loadAssignedTasks(): void {
    this.loading = true;
    const projectId = this.taskAssignmentService.projectIdSubject.value;

    this.assignedTasks$ = this.taskAssignmentService.userId$.pipe(
      switchMap(userId => {
        if (!userId || !projectId) return of([]);
        return this.taskAssignmentService.getAllTasksForProject(userId, projectId);
      }),
      map(tasks => tasks.map(task => ({
        ...task,
        assignedBy: task.assignedBy || { name: 'System' }
      })))
    );

    this.filteredTasks$ = this.assignedTasks$.pipe(
      map(tasks => this.applyFilters(tasks))
    );

    this.assignedTasks$.subscribe(() => this.loading = false);
  }

  applyFilters(tasks: any[]): any[] {
    let filtered = tasks.filter(task => {
      if (this.nameFilter &&
        !task.name.toLowerCase().includes(this.nameFilter.toLowerCase())) {
        return false;
      }

      if (this.statusFilter && task.status !== this.statusFilter) {
        return false;
      }

      if (this.assignedByFilter &&
        (!task.assignedBy?.name ||
          !task.assignedBy.name.toLowerCase().includes(this.assignedByFilter.toLowerCase()))) {
        return false;
      }

      if (this.dateFrom) {
        const taskDate = new Date(task.assignedAt);
        const fromDate = new Date(this.dateFrom);
        if (taskDate < fromDate) {
          return false;
        }
      }

      if (this.dateTo) {
        const taskDate = new Date(task.assignedAt);
        const toDate = new Date(this.dateTo);
        toDate.setDate(toDate.getDate() + 1);
        if (taskDate > toDate) {
          return false;
        }
      }

      return true;
    });

    if (this.sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const valueA = this.getSortableValue(a, this.sortColumn);
        const valueB = this.getSortableValue(b, this.sortColumn);

        if (valueA < valueB) {
          return this.sortDirection === 'asc' ? -1 : 1;
        } else if (valueA > valueB) {
          return this.sortDirection === 'asc' ? 1 : -1;
        } else {
          return 0;
        }
      });
    }

    return filtered;
  }



  getSortableValue(task: any, column: string): any {
    switch(column) {
      case 'name': return task.name;
      case 'status': return task.status;
      case 'deadline': return task.deadline || '';
      case 'assignedBy': return task.assignedBy?.name || '';
      case 'assignedAt': return new Date(task.assignedAt).getTime();
      default: return '';
    }
  }

  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadAssignedTasks();
  }

  getSortIndicator(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? '▲' : '▼';
    }
    return '';
  }

  toggleTaskDetails(taskId: string, menuTrigger: any): void {
    const isExpanding = this.expandedTaskId !== taskId;
    this.expandedTaskId = isExpanding ? taskId : null;

    if (isExpanding) {
      this.taskSelectionService.setSelectedTaskId(taskId);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { taskId },
        queryParamsHandling: 'merge'
      });
    } else {
      this.taskSelectionService.clearSelectedTaskId();
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { taskId: null },
        queryParamsHandling: 'merge'
      });
    }

    menuTrigger.closeMenu();
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
      case this.TASK_STATUS.REOPENED: return 'primary';
      default: return '';
    }
  }
}
