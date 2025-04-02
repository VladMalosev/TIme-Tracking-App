import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject, Observable, switchMap, take, tap} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskAssignmentService {
  private projectIdSubject = new BehaviorSubject<string>('');
  private tasksSubject = new BehaviorSubject<any[]>([]);
  private collaboratorsSubject = new BehaviorSubject<any[]>([]);
  private currentUserRoleSubject = new BehaviorSubject<string>('');
  private userIdSubject = new BehaviorSubject<string>('');
  private selectedTaskSubject = new BehaviorSubject<any>(null);
  private selectedUserSubject = new BehaviorSubject<any>(null);

  projectId$ = this.projectIdSubject.asObservable();
  tasks$ = this.tasksSubject.asObservable();
  collaborators$ = this.collaboratorsSubject.asObservable();
  currentUserRole$ = this.currentUserRoleSubject.asObservable();
  userId$ = this.userIdSubject.asObservable();
  selectedTask$ = this.selectedTaskSubject.asObservable();
  selectedUser$ = this.selectedUserSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  public removeTask(taskId: string): void {
    const currentTasks = this.tasksSubject.value;
    const updatedTasks = currentTasks.filter(t => t.id !== taskId);
    this.tasksSubject.next(updatedTasks);
  }

  public refreshTasks(): void {
    this.tasksSubject.next([...this.tasksSubject.value]);
  }


  setProjectId(projectId: string): void {
    this.projectIdSubject.next(projectId);
  }

  setTasks(tasks: any[]): void {
    this.tasksSubject.next(tasks || []);
  }

  setCollaborators(collaborators: any[]): void {
    this.collaboratorsSubject.next(collaborators || []);
  }

  setCurrentUserRole(role: string): void {
    this.currentUserRoleSubject.next(role || '');
  }

  setUserId(userId: string): void {
    this.userIdSubject.next(userId || '');
  }

  setSelectedTask(task: any): void {
    this.selectedTaskSubject.next(task);
  }

  setSelectedUser(user: any): void {
    this.selectedUserSubject.next(user);
  }

  assignTask(taskId: string, userId: string, assignedBy: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('assignedBy', assignedBy);

    return this.http.post<any>(
      `${environment.apiBaseUrl}/tasks/${taskId}/assign`,
      null,
      {params, withCredentials: true}
    );
  }

  getUnassignedPendingTasks(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiBaseUrl}/tasks/unassigned-pending/${projectId}`,
      {withCredentials: true}
    );
  }

  canAssignTasks(): boolean {
    const allowedRoles = ['ADMIN', 'OWNER', 'MANAGER'];
    return allowedRoles.includes(this.currentUserRoleSubject.value);
  }

  getAssignedTasks(userId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiBaseUrl}/tasks/assigned/${userId}`,
      {withCredentials: true}
    );
  }

  updateTaskStatus(taskId: string, status: string): Observable<any> {
    const params = new HttpParams().set('status', status);
    return this.http.put<any>(
      `${environment.apiBaseUrl}/tasks/${taskId}/status`,
      null,
      {params, withCredentials: true}
    );
  }

  startTask(taskId: string): Observable<any> {
    return this.updateTaskStatus(taskId, 'IN_PROGRESS');
  }

  completeTask(taskId: string): Observable<any> {
    return this.updateTaskStatus(taskId, 'COMPLETED');
  }

  getTaskCompletionDetails(taskId: string): Observable<any> {
    return this.http.get(
      `${environment.apiBaseUrl}/tasks/${taskId}/completion-details`,
      {withCredentials: true}
    );
  }

  getTaskDetails(taskId: string): Observable<any> {
    return this.http.get<any>(
      `${environment.apiBaseUrl}/tasks/${taskId}`,
      {withCredentials: true});
  }

  startTimeLog(projectId: string, taskId: string, description: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          console.error('User ID not available');
          throw new Error('User ID not available');
        }
        if (!projectId) {
          console.error('Project ID is required');
          throw new Error('Project ID is required');
        }

        const body = {
          userId: userId,
          projectId: projectId,
          taskId: taskId || null,
          description: description || ""
        };

        console.log('Sending time log start request to server:', body);

        return this.http.post(
          `${environment.apiBaseUrl}/timelogs/start`,
          body,
          {
            withCredentials: true,
            observe: 'response'
          }
        ).pipe(
          tap(response => {
            console.log('Server response:', {
              status: response.status,
              body: response.body,
              headers: response.headers
            });
          })
        );
      })
    );
  }

  stopTimeLog(taskId: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        return this.http.post(
          `${environment.apiBaseUrl}/timelogs/stop`,
          {
            userId,
            taskId
          },
          {withCredentials: true}
        );
      })
    );
  }

  createManualTimeLog(taskId: string, startTime: string, endTime: string, description: string): Observable<any> {
    return this.userId$.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User ID not available');
        }
        if (!this.projectIdSubject.value) {
          throw new Error('Project ID is required');
        }
        return this.http.post(
          `${environment.apiBaseUrl}/timelogs/manual`,
          {
            userId,
            projectId: this.projectIdSubject.value,
            taskId,
            startTime: this.formatForBackend(startTime),
            endTime: this.formatForBackend(endTime),
            description
          },
          { withCredentials: true }
        );
      })
    );
  }

  private formatForBackend(datetime: string): string {
    if (!datetime) return datetime;

    if (datetime.length === 16) {
      return `${datetime}:00.000`;
    }
    return datetime;
  }



  reopenTask(taskId: string): Observable<any> {
    return this.http.put(
      `${environment.apiBaseUrl}/tasks/${taskId}/reopen`,
      {},
      { withCredentials: true }
    );
  }
}
