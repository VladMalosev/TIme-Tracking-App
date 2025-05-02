import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import { Task } from '../../models/main-dashboard';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  constructor(private http: HttpClient) {}

  getTasksWithDeadlines(userId: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${environment.apiBaseUrl}/tasks/user/${userId}/upcoming`, {withCredentials: true}).pipe(
      map(tasks => tasks.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }))
    );
  }
}
