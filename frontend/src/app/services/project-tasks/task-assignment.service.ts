import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

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
    return this.http.post<any>(
      `http://localhost:8080/api/tasks/${taskId}/assign?userId=${userId}&assignedBy=${assignedBy}`,
      {},
      { withCredentials: true }
    );
  }

  canAssignTasks(): boolean {
    const allowedRoles = ['ADMIN', 'OWNER', 'MANAGER'];
    return allowedRoles.includes(this.currentUserRoleSubject.value);
  }
}
