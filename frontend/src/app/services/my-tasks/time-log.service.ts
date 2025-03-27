import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimeLogService {
  constructor(private http: HttpClient) {}


  getTimeLogsByTask(taskId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiBaseUrl}/timelogs/task/${taskId}`,
      { withCredentials: true }
    );
  }
}
