import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {Subscription} from 'rxjs';
import {TaskLogService} from '../../../../../services/project-tasks/task-log.service';

@Component({
  selector: 'app-tasklog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './tasklog.component.html',
  styleUrls: ['./tasklog.component.scss']
})
export class TaskLogComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  task: any;
  logs: any[] = [];

  constructor(private taskLogService: TaskLogService) {}



  ngOnInit() {
    this.subscriptions.add(
      this.taskLogService.task$.subscribe(task => {
        this.task = task;
      })
    );

    this.subscriptions.add(
      this.taskLogService.logs$.subscribe(logs => {
        this.logs = logs;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  actionFilter: string = '';
  userFilter: string = '';
  statusFilter: string = '';
  dateFrom: Date | null = null;
  dateTo: Date | null = null;

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'CREATED', label: 'Created' },
    { value: 'UPDATED', label: 'Updated' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'STATUS_CHANGED', label: 'Status Changed' }
  ];

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  displayedColumns: string[] = [
    'action',
    'user',
    'targetUser',
    'statusChange',
    'taskName',
    'description',
    'deadline',
    'timestamp'
  ];

  get filteredLogs() {
    let filtered = this.logs.filter(log => {
      if (this.actionFilter && log.action !== this.actionFilter) {
        return false;
      }

      if (this.userFilter &&
        (!log.user?.name ||
          !log.user.name.toLowerCase().includes(this.userFilter.toLowerCase()))) {
        return false;
      }

      if (this.statusFilter) {
        const isStatusAction = log.action === 'STATUS_CHANGED' ||
          log.action === 'CREATED' ||
          log.action === 'COMPLETED' ||
          log.action === 'ASSIGNED';

        if (!isStatusAction || this.getLogStatus(log) !== this.statusFilter) {
          return false;
        }
      }

      const logDate = new Date(log.timestamp);
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

  getSortableValue(log: any, column: string): any {
    switch(column) {
      case 'action':
        return log.action;
      case 'user':
        return log.user?.name || 'System';
      case 'targetUser':
        return log.action === 'ASSIGNED' ? (this.task.assignedTo?.name || 'Unassigned') : '';
      case 'statusChange':
        return this.getLogStatus(log);
      case 'taskName':
        return this.task.name;
      case 'description':
        return this.task.description || '';
      case 'deadline':
        return this.task.deadline || '';
      case 'timestamp':
        return new Date(log.timestamp).getTime();
      default:
        return '';
    }
  }

  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  getSortIndicator(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? '▲' : '▼';
    }
    return '';
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'PENDING': return 'status-pending';
      case 'ASSIGNED': return 'status-assigned';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'COMPLETED': return 'status-completed';
      default: return '';
    }
  }

  resetFilters(): void {
    this.actionFilter = '';
    this.userFilter = '';
    this.statusFilter = '';
    this.dateFrom = null;
    this.dateTo = null;
    this.sortColumn = '';
    this.sortDirection = 'asc';
  }

  getLogStatus(log: any): string {
    if (log.status) {
      return log.status;
    }

    if (log.action === 'CREATED') {
      return this.task.status;
    }

    if (log.action === 'ASSIGNED') {
      return 'ASSIGNED';
    }

    if (log.action === 'COMPLETED') {
      return 'COMPLETED';
    }

    return 'PENDING';
  }
}
