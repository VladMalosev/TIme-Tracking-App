import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject, Observable, interval, throwError} from 'rxjs';
import { tap, switchMap, takeWhile } from 'rxjs/operators';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private membersSubject = new BehaviorSubject<any[]>([]);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private onlineUsersSubject = new BehaviorSubject<string[]>([]);

  members$ = this.membersSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  onlineUsers$ = this.onlineUsersSubject.asObservable();

  private currentProjectId: string | null = null;

  constructor(private http: HttpClient) {}

  initialize(projectId: string): void {
    this.currentProjectId = projectId;
    this.fetchProjectMembers();
    this.startOnlineStatusPolling();
  }

  private fetchProjectMembers(): void {
    if (!this.currentProjectId) return;

    this.http.get<any[]>(`http://localhost:8080/api/projects/${this.currentProjectId}/collaborators`, { withCredentials: true })
      .subscribe(
        (response) => {
          const members = response.map(member => ({
            ...member,
            status: this.onlineUsersSubject.value.includes(member.user.email) ? 'Online' : 'Offline'
          }));
          this.membersSubject.next(members);
          this.errorSubject.next(null);
        },
        (error) => {
          console.error('Error fetching project members', error);
          this.errorSubject.next('Failed to fetch project members. Please try again.');
        }
      );
  }

  private startOnlineStatusPolling(): void {
    interval(50000).pipe(
      switchMap(() => this.http.get<string[]>('http://localhost:8080/api/auth/online-users', { withCredentials: true })),
      tap(users => {
        this.onlineUsersSubject.next(users);
        this.updateMembersStatus();
      })
    ).subscribe();
  }

  private updateMembersStatus(): void {
    const currentMembers = this.membersSubject.value;
    const updatedMembers = currentMembers.map(member => ({
      ...member,
      status: this.onlineUsersSubject.value.includes(member.user.email) ? 'Online' : 'Offline'
    }));
    this.membersSubject.next(updatedMembers);
  }

  removeMember(memberId: string): Observable<void> {
    return this.http.delete<void>(
      `http://localhost:8080/api/projects/${this.currentProjectId}/collaborators/${memberId}`,
      { withCredentials: true }
    ).pipe(
      tap(() => {
        const updatedMembers = this.membersSubject.value.filter(member => member.id !== memberId);
        this.membersSubject.next(updatedMembers);
      })
    );
  }

  updateMemberRole(memberId: string, newRole: string): Observable<any> {
    const projectId = this.currentProjectId;
    if (!projectId) {
      return throwError(() => new Error('No project selected'));
    }

    return this.http.patch(
      `http://localhost:8080/api/projects/${projectId}/collaborators/${memberId}/role`,
      { role: newRole },
      { withCredentials: true }
    );
  }

  changeProjectMemberRole(projectId: string, memberId: string, newRole: string): Observable<any> {
    return this.http.put(
      `${environment.apiBaseUrl}/projects/${projectId}/collaborators/${memberId}/role`,
      null,
      { params: { newRole },
        withCredentials: true }
    );
  }

  removeProjectMember(projectId: string, memberId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiBaseUrl}/projects/${projectId}/collaborators/${memberId}`,
      { withCredentials: true }
    );
  }
}
