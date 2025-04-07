import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, switchMap, tap, of, take } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ProjectContextService } from '../project-context.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskListService {
  private tasksSubject = new BehaviorSubject<any[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private viewAllTasksSubject = new BehaviorSubject<void>(undefined);
  private logTaskTimeSubject = new BehaviorSubject<any>(null);

  tasks$ = this.tasksSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  viewAllTasks$ = this.viewAllTasksSubject.asObservable();
  logTaskTime$ = this.logTaskTimeSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private projectContextService: ProjectContextService
  ) {
    this.initializeTaskFetching();
  }

  private initializeTaskFetching(): void {
    combineLatest([
      this.projectContextService.currentProjectId$,
      this.authService.userId$
    ]).pipe(
      tap(() => this.loadingSubject.next(true)),
      switchMap(([projectId, userId]) => {
        if (!projectId || !userId) {
          return of([]);
        }
        return this.fetchUserTasks(projectId, userId);
      }),
      tap(() => this.loadingSubject.next(false))
    ).subscribe(tasks => {
      this.tasksSubject.next(tasks);
    });
  }

  private fetchUserTasks(projectId: string, userId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiBaseUrl}/tasks/project/${projectId}/user/${userId}/incomplete`,
      { withCredentials: true }
    );
  }

  refreshTasks(): void {
    combineLatest([
      this.projectContextService.currentProjectId$.pipe(take(1)),
      this.authService.userId$.pipe(take(1))
    ]).subscribe(([projectId, userId]) => {
      if (projectId && userId) {
        this.loadingSubject.next(true);
        this.fetchUserTasks(projectId, userId).subscribe({
          next: (tasks) => {
            this.tasksSubject.next(tasks);
            this.loadingSubject.next(false);
          },
          error: () => this.loadingSubject.next(false)
        });
      }
    });
  }

  triggerViewAllTasks(): void {
    this.viewAllTasksSubject.next();
  }

  triggerLogTaskTime(task: any): void {
    this.logTaskTimeSubject.next(task);
  }

  isTaskUrgent(task: any): boolean {
    if (!task.dueDate) return false;
    const today = new Date();
    const due = new Date(task.dueDate);
    return task.status !== 'COMPLETED' && due.getTime() - today.getTime() <= 2 * 24 * 60 * 60 * 1000;
  }
}
