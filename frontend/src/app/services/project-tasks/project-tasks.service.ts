import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectTasksService {
  private projectIdSubject = new BehaviorSubject<string>('');
  private currentUserRoleSubject = new BehaviorSubject<string>('');

  projectId$ = this.projectIdSubject.asObservable();
  currentUserRole$ = this.currentUserRoleSubject.asObservable();

  constructor(private http: HttpClient) {}

  setProjectId(projectId: string): void {
    this.projectIdSubject.next(projectId);
  }

  setCurrentUserRole(role: string): void {
    this.currentUserRoleSubject.next(role);
  }

  loadTasks(projectId: string) {
    return this.http.get<any[]>(
      `http://localhost:8080/api/tasks/project/${projectId}`,
      { withCredentials: true }
    );
  }

}
