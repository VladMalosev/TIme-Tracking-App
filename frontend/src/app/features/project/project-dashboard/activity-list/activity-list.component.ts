// activity-list.component.ts
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { ActivityService } from '../../../../services/dashboard/activity.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ProjectContextService } from '../../../../services/project-context.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTooltip } from '@angular/material/tooltip';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-activity-list',
  templateUrl: './activity-list.component.html',
  standalone: true,
  imports: [
    MatIcon,
    NgClass,
    NgForOf,
    NgIf,
    MatProgressSpinner,
    MatPaginator,
    MatTooltip
  ],
  styleUrls: ['./activity-list.component.scss'],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0, transform: 'translateY(10px)' })),
      transition('void => *', animate('300ms ease-out')),
    ]),
  ]
})
export class ActivityListComponent implements OnInit, OnDestroy {
  activities: any[] = [];
  filteredActivities: any[] = [];
  isLoading = true;
  private destroy$ = new Subject<void>();

  pageSize = 5;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 15];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private activityService: ActivityService,
    private authService: AuthService,
    private projectContextService: ProjectContextService
  ) {}

  ngOnInit(): void {
    this.authService.userId$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(userId => {
      if (userId) {
        this.loadActivities(userId);
      } else {
        this.isLoading = false;
      }
    });

    this.projectContextService.currentProjectId$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
    });
  }

  loadActivities(userId: string): void {
    this.isLoading = true;
    const projectId = this.projectContextService.getCurrentProjectId();

    this.activityService.getUserActivities(userId, projectId || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (activities) => {
          this.activities = activities;
          this.updatePaginatedActivities();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load activities:', err);
          this.isLoading = false;
        }
      });
  }

  updatePaginatedActivities(): void {
    const startIndex = this.pageIndex * this.pageSize;
    this.filteredActivities = this.activities.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedActivities();
  }

  getActivityType(activity: any): string {
    if (!activity || !activity.type) return 'default';
    switch (activity.type) {
      case 'TASK_CREATED': return 'task-created';
      case 'TASK_UPDATED': return 'task-updated';
      case 'TASK_COMPLETED': return 'task-completed';
      case 'TIME_LOGGED': return 'time-logged';
      case 'TIME_LOG_LINKED': return 'time-log-linked';
      default: return 'default';
    }
  }

  getActivityIcon(activity: any): string {
    if (!activity || !activity.type) return 'info';
    switch (activity.type) {
      case 'TASK_CREATED': return 'add_task';
      case 'TASK_UPDATED': return 'edit';
      case 'TASK_COMPLETED': return 'check_circle';
      case 'TIME_LOGGED': return 'access_time';
      case 'TIME_LOG_LINKED': return 'link';
      default: return 'info';
    }
  }

  getActivityTitle(activity: any): string {
    if (!activity || !activity.type) return 'Activity';
    switch (activity.type) {
      case 'TASK_CREATED': return 'Task Created';
      case 'TASK_UPDATED': return 'Task Updated';
      case 'TASK_COMPLETED': return 'Task Completed';
      case 'TIME_LOGGED': return 'Time Logged';
      case 'TIME_LOG_LINKED': return 'Time Log Linked';
      default: return 'Activity';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
