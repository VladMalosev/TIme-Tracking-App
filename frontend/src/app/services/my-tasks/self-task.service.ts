import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../environments/environment';

interface SelfTask {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  createdBy: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SelfTaskService {
  constructor(private http: HttpClient) { }

  createSelfTask(taskData: {
    name: string;
    description?: string;
    projectId: string;
    deadline?: Date;
  }): Observable<SelfTask> {
    return this.http.post<SelfTask>(
      `${environment.apiBaseUrl}/tasks/self`,
      taskData,
      { withCredentials: true }
    );
  }

  updateTaskStatus(taskId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'): Observable<SelfTask> {
    return this.http.put<SelfTask>(
      `${environment.apiBaseUrl}/tasks/self/${taskId}/status`,
      { status },
      { withCredentials: true }
    );
  }

  deleteTask(taskId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiBaseUrl}/tasks/self/${taskId}`,
      { withCredentials: true }
    );
  }

  getUserSelfTasks(userId: string): Observable<SelfTask[]> {
    return this.http.get<SelfTask[]>(
      `${environment.apiBaseUrl}/users/${userId}/self-tasks`,
      { withCredentials: true }
    );
  }

  getTask(taskId: string): Observable<SelfTask> {
    return this.http.get<SelfTask>(
      `${environment.apiBaseUrl}/tasks/self/${taskId}`,
      { withCredentials: true }
    );
  }
}
