import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WelcomeCardService {
  private projectName = new BehaviorSubject<string>('');
  private projectDeadline = new BehaviorSubject<string>('');
  private projectDescription = new BehaviorSubject<string>('');
  private totalMembers = new BehaviorSubject<number>(0);
  private totalHoursLogged = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  projectName$ = this.projectName.asObservable();
  projectDeadline$ = this.projectDeadline.asObservable();
  projectDescription$ = this.projectDescription.asObservable();
  totalMembers$ = this.totalMembers.asObservable();
  totalHoursLogged$ = this.totalHoursLogged.asObservable();

  fetchProjectData(projectId: string): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/projects/${projectId}/stats`, {
      withCredentials: true
    }).pipe(
        tap((stats: any) => {
          this.totalMembers.next(stats.totalMembers || 0);
        }),
        catchError(error => {
          console.error('Error fetching project stats', error);
          throw error;
        })
    );
  }

  fetchProjectDetails(projectId: string): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/projects/${projectId}`, {
      withCredentials: true
    }).pipe(
        tap((project: any) => {
          this.projectName.next(project.name || '');
          this.projectDeadline.next(project.deadline || '');
          this.projectDescription.next(project.description || '');
        }),
        catchError(error => {
          console.error('Error fetching project details', error);
          throw error;
        })
    );
  }

  fetchTotalHoursLogged(projectId: string, userId: string): Observable<any> {
    return this.http.get(`${environment.apiBaseUrl}/timelogs/project/${projectId}/user/${userId}/stats`, {
      withCredentials: true
    }).pipe(
        tap((stats: any) => {
          const hours = stats.totalLogged ? Math.round(stats.totalLogged / 60) : 0;
          this.totalHoursLogged.next(hours);
        }),
        catchError(error => {
          console.error('Error fetching time logs', error);
          throw error;
        })
    );
  }
}
