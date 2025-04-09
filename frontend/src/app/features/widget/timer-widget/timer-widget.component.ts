import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, interval } from 'rxjs';
import {TimeLogService} from '../../../services/my-tasks/time-log.service';
import {ProjectContextService} from '../../../services/project-context.service';
import {MatIcon} from '@angular/material/icon';
import {NgForOf, NgIf} from '@angular/common';

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
  private refreshInterval = 5000;

  constructor(
    private timeLogService: TimeLogService,
    private projectContextService: ProjectContextService
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

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
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
}
