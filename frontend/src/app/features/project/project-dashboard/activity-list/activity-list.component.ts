import { Component, Input } from '@angular/core';
import {NgClass, NgForOf} from '@angular/common';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-activity-list',
  templateUrl: './activity-list.component.html',
  imports: [
    MatIcon,
    NgClass,
    NgForOf
  ],
  styleUrls: ['./activity-list.component.scss']
})
export class ActivityListComponent {
  activities: any[] = [];

  getActivityType(activity: any): string {
    if (!activity || !activity.type) return 'default';
    switch (activity.type) {
      case 'TASK_CREATED': return 'task-created';
      case 'TIME_LOGGED': return 'time-logged';
      case 'TASK_COMPLETED': return 'task-completed';
      default: return 'default';
    }
  }

  getActivityIcon(activity: any): string {
    if (!activity || !activity.type) return 'info';
    switch (activity.type) {
      case 'TASK_CREATED': return 'add_task';
      case 'TIME_LOGGED': return 'access_time';
      case 'TASK_COMPLETED': return 'check_circle';
      default: return 'info';
    }
  }
}
