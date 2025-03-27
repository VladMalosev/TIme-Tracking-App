import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
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

  constructor(private http: HttpClient) {}

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
      { params, withCredentials: true }
    );
  }

  getUnassignedPendingTasks(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiBaseUrl}/tasks/unassigned-pending/${projectId}`,
      { withCredentials: true }
    );
  }

  canAssignTasks(): boolean {
    const allowedRoles = ['ADMIN', 'OWNER', 'MANAGER'];
    return allowedRoles.includes(this.currentUserRoleSubject.value);
  }

  getAssignedTasks(userId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiBaseUrl}/tasks/assigned/${userId}`,
      { withCredentials: true }
    );
  }

  updateTaskStatus(taskId: string, status: string): Observable<any> {
    return this.http.put<any>(
      `${environment.apiBaseUrl}/tasks/${taskId}/status`,
      { status },
      { withCredentials: true }
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
      { withCredentials: true }
    );
  }

  getTaskDetails(taskId: string): Observable<any> {
    return this.http.get<any>(
      `${environment.apiBaseUrl}/tasks/${taskId}`,
      { withCredentials: true } );
  }

}
