import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor(private http: HttpClient) {}

  getUserProjects(userId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/projects`, {
      params: { userId },
    withCredentials: true
    });
  }
}
