import { Injectable } from '@angular/core';
import {BehaviorSubject, map, Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectRoleService {
  private currentUserRoleSubject = new BehaviorSubject<string>('');

  currentUserRole$ = this.currentUserRoleSubject.asObservable();



  constructor(private http: HttpClient) { }

  fetchCurrentUserRole(projectId: string): Observable<string> {
    return this.http.get<{ role: string }>(
      `${environment.apiBaseUrl}/projects/${projectId}/current-user-role`,
      { withCredentials: true }
    ).pipe(
      map(response => {
        const role = response.role;
        this.currentUserRoleSubject.next(role);
        return role;
      })
    );
  }

  hasRequiredRole(requiredRole: string[]): Observable<boolean> {
    return this.currentUserRole$.pipe(
      map(role => requiredRole.includes(role))
    );
  }

  getCurrentRole(): string {
    return this.currentUserRoleSubject.value;
  }

}
