import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subject, takeUntil, interval } from 'rxjs';
import { TimeLogService } from '../../../services/my-tasks/time-log.service';
import { ProjectContextService } from '../../../services/project-context.service';
import { MatIcon } from '@angular/material/icon';
import { NgForOf, NgIf } from '@angular/common';
import { TimeEntryStateService } from '../../../services/my-tasks/time-entry-state.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-timer-widget',
  templateUrl: './timer-widget.component.html',
  imports: [
    MatIcon,
    NgForOf,
    NgIf
  ],
  styleUrls: ['./timer-widget.component.scss']
})
export class TimerWidgetComponent implements OnInit, OnDestroy {
  activeTimers: any[] = [];
  collapsed = false;
  private destroy$ = new Subject<void>();
  private refreshInterval = 1000;

  // Dragging functionality
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  dragPosition = 'translate(0, 0)';

  constructor(
    private timeLogService: TimeLogService,
    private projectContextService: ProjectContextService,
    private timeEntryState: TimeEntryStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.timeLogService.userId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(userId => {
        if (userId) {
          this.loadActiveTimers();
          interval(this.refreshInterval)
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => this.loadActiveTimers());
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Dragging functionality
  startDrag(event: MouseEvent): void {
    if (this.collapsed) {
      this.isDragging = true;
      this.startX = event.clientX;
      this.startY = event.clientY;
      event.preventDefault();
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onDrag(event: MouseEvent): void {
    if (!this.isDragging) return;

    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    this.dragPosition = `translate(${dx}px, ${dy}px)`;
  }

  @HostListener('document:mouseup')
  endDrag(): void {
    this.isDragging = false;
    this.dragPosition = 'translate(0, 0)';
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    // Removed the dragging check since we're not handling drag in expanded state
  }

  loadActiveTimers(): void {
    this.timeLogService.getActiveTimers().subscribe({
      next: (timers) => {
        this.activeTimers = timers.map(timer => ({
          ...timer,
          currentDuration: this.calculateCurrentDuration(timer)
        }));
      },
      error: (err) => console.error('Error loading active timers:', err)
    });
  }

  calculateCurrentDuration(timer: any): string {
    if (!timer.startTime) return '0h 0m';

    const start = new Date(timer.startTime);
    const end = timer.endTime ? new Date(timer.endTime) : new Date();
    const duration = (end.getTime() - start.getTime()) / 1000;

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  stopTimer(timerId: string): void {
    this.timeLogService.stopTimer(timerId).subscribe({
      next: () => {
        this.loadActiveTimers();
        this.timeEntryState.notifyTimerStopped(timerId);
      },
      error: (err) => console.error('Error stopping timer:', err)
    });
  }

  getProjectName(timer: any): string {
    return timer.project?.name || 'No project';
  }

  getTaskName(timer: any): string {
    return timer.task?.name || 'No task';
  }

  goToTask(timer: any): void {
    const taskId = timer.task?.id;
    const projectId = timer.project?.id;

    if (taskId && projectId) {
      this.router.navigate([`/project-details/${projectId}/dashboard`], {
        queryParams: { tab: 'tasks', subTab: 'assigned-tasks', taskId }
      });
    } else if (projectId) {
      this.router.navigate([`/project-details/${projectId}/dashboard`], {
        queryParams: { tab: 'tasks', subTab: 'time-logs' }
      });
    } else {
      console.warn('No project or task info available for navigation.');
    }
  }

  goToProject(timer: any): void {
    const projectId = timer.project?.id;
    if (projectId) {
      this.router.navigate([`/project-details/${projectId}/dashboard`]);
    } else {
      console.warn('No project info available for navigation.');
    }
  }
}
