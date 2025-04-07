import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ActivityListService {
  private activities = new BehaviorSubject<any[]>([]);
  activities$ = this.activities.asObservable();

  setActivities(activities: any[]) {
    this.activities.next(activities);
  }
}
