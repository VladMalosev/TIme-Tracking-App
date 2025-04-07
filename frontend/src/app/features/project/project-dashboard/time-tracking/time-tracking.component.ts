import { Component, Input, Output, EventEmitter } from '@angular/core';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-time-tracking',
  templateUrl: './time-tracking.component.html',
  imports: [
    MatIcon
  ],
  styleUrls: ['./time-tracking.component.scss']
})
export class TimeTrackingComponent {
  totalHoursLogged: number = 0;
  weeklyGoal: number = 40; // Default to 40 hours

  logTime = new EventEmitter<void>();
  viewTrends = new EventEmitter<void>();

  get progressPercentage(): number {
    return Math.min(100, Math.round((this.totalHoursLogged / this.weeklyGoal) * 100));
  }

  get remainingHours(): number {
    return Math.max(0, this.weeklyGoal - this.totalHoursLogged);
  }
}
