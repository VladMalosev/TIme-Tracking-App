import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {ProductivityStats, TaskStats, TimeStats} from '../../../models';

@Injectable({
  providedIn: 'root'
})
export class DashboardStatsService {
  private timeStatsSubject = new BehaviorSubject<TimeStats>({
    totalLogged: 0,
    weeklyAverage: 0,
    taskDistribution: []
  });
  private taskStatsSubject = new BehaviorSubject<TaskStats>({
    totalTasks: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  });
  private productivityStatsSubject = new BehaviorSubject<ProductivityStats>({
    frequentTasks: [],
    logPatterns: null
  });

  timeStats$ = this.timeStatsSubject.asObservable();
  taskStats$ = this.taskStatsSubject.asObservable();
  productivityStats$ = this.productivityStatsSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadAllStats(userId: string, projectId: string | null = null): void {
    const projectFilter = projectId ? `?projectId=${projectId}` : '';
    const baseUrl = 'http://localhost:8080/api';

    forkJoin([
      this.http.get<TimeStats>(`${baseUrl}/timelogs/user/${userId}/stats${projectFilter}`, { withCredentials: true }),
      this.http.get<TaskStats>(`${baseUrl}/tasks/user/${userId}/stats${projectFilter}`, { withCredentials: true }),
      this.http.get<ProductivityStats>(`${baseUrl}/analytics/user/${userId}${projectFilter}`, { withCredentials: true }),
      this.http.get<any>(`${baseUrl}/analytics/user/${userId}/log-patterns${projectFilter}`, { withCredentials: true })
    ]).pipe(
      catchError(err => {
        console.error('Error loading dashboard stats:', err);
        return of([]);
      })
    ).subscribe({
      next: ([timeData, taskData, prodData, logPatterns]) => {
        this.timeStatsSubject.next({
          totalLogged: timeData?.totalLogged || 0,
          weeklyAverage: timeData?.weeklyAverage || 0,
          taskDistribution: timeData?.taskDistribution || []
        });

        this.taskStatsSubject.next({
          totalTasks: taskData?.totalTasks || 0,
          completed: taskData?.completed || 0,
          inProgress: taskData?.inProgress || 0,
          pending: taskData?.pending || 0
        });

        this.productivityStatsSubject.next({
          frequentTasks: prodData?.frequentTasks || [],
          logPatterns: logPatterns
        });
      }
    });
  }

  getMostProductiveDay(logPatterns: any): string | null {
    if (!logPatterns?.dailyDistribution?.length) return null;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const maxEntry = logPatterns.dailyDistribution.reduce((prev: any, current: any) =>
      (Number(prev.count) > Number(current.count)) ? prev : current);
    return days[Number(maxEntry.day)];
  }

  getLeastProductiveDay(logPatterns: any): string | null {
    if (!logPatterns?.dailyDistribution?.length) return null;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const minEntry = logPatterns.dailyDistribution.reduce((prev: any, current: any) =>
      (Number(prev.count) < Number(current.count)) ? prev : current);
    return days[Number(minEntry.day)];
  }

  formatMinutes(minutes: number): string {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
}
