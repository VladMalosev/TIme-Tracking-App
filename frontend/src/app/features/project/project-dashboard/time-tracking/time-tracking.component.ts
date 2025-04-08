import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import {TimeTrackingService} from '../../../../services/dashboard/time-tracking.service';
import {AuthService} from '../../../../core/auth/auth.service';
import {DecimalPipe} from '@angular/common';
import {ProjectContextService} from '../../../../services/project-context.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-time-tracking',
  templateUrl: './time-tracking.component.html',
  imports: [
    MatIcon,
    DecimalPipe
  ],
  styleUrls: ['./time-tracking.component.scss']
})
export class TimeTrackingComponent implements OnInit {
  totalHoursLogged: number = 0;
  weeklyGoal: number = 40;
  userId: string | null = null;


  constructor(private timeTrackingService: TimeTrackingService,
              private authService: AuthService,
              private projectContextService: ProjectContextService,
              private router: Router) { }


  ngOnInit(): void {
    this.authService.userId$.subscribe((userId) => {
      this.userId = userId;
      if (userId) {
        this.fetchTimeLoggedForWeek(userId);
      }
    });
  }

  fetchTimeLoggedForWeek(userId: string): void {
    this.timeTrackingService.getTimeLoggedForWeek(userId).subscribe(
      (data) => {
        this.totalHoursLogged = data.totalLogged / 60;
      },
      (error) => {
        console.error('Error fetching time logs', error);
      }
    );
  }

  get progressPercentage(): number {
    return Math.min(100, Math.round((this.totalHoursLogged / this.weeklyGoal) * 100));
  }

  get remainingHours(): number {
    return Math.max(0, this.weeklyGoal - this.totalHoursLogged);
  }

  logTime(): void {
    const projectId = this.projectContextService.getCurrentProjectId();
    if (projectId) {
      this.router.navigate(
        [`/project-details/${projectId}/dashboard`],
        {
          queryParams: {
            tab: 'tasks',
            subTab: 'time-logs'
          }
        }
      );
    }
  }
  viewTrends(): void {
    const projectId = this.projectContextService.getCurrentProjectId();
    if (projectId) {
      this.router.navigate(
        [`/project-details/${projectId}/dashboard`],
        {
          queryParams: {
            tab: 'tasks',
            subTab: 'statistics'
          }
        }
      );
    }
  }
}
