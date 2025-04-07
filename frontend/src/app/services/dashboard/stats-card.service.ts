import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StatsCardService {
  private totalTasks = new BehaviorSubject<number>(0);
  private completedTasks = new BehaviorSubject<number>(0);
  private totalHoursLogged = new BehaviorSubject<number>(0);
  private upcomingDeadlines = new BehaviorSubject<number>(0);

  totalTasks$ = this.totalTasks.asObservable();
  completedTasks$ = this.completedTasks.asObservable();
  totalHoursLogged$ = this.totalHoursLogged.asObservable();
  upcomingDeadlines$ = this.upcomingDeadlines.asObservable();

  setStats(total: number, completed: number, hours: number, deadlines: number) {
    this.totalTasks.next(total);
    this.completedTasks.next(completed);
    this.totalHoursLogged.next(hours);
    this.upcomingDeadlines.next(deadlines);
  }
}
