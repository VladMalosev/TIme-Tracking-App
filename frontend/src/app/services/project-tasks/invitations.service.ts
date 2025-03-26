import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class InvitationsService {
  private projectIdSubject = new BehaviorSubject<string>('');
  private currentUserRoleSubject = new BehaviorSubject<string>('');
  private invitationsSubject = new BehaviorSubject<any[]>([]);

  projectId$: Observable<string> = this.projectIdSubject.asObservable();
  currentUserRole$: Observable<string> = this.currentUserRoleSubject.asObservable();
  invitations$: Observable<any[]> = this.invitationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  setProjectId(projectId: string): void {
    this.projectIdSubject.next(projectId || '');
  }

  setCurrentUserRole(role: string): void {
    this.currentUserRoleSubject.next(role || '');
  }

  loadInvitations(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `http://localhost:8080/api/invitations/project/${projectId}`,
      { withCredentials: true }
    );
  }

  addCollaborator(projectId: string, email: string, role: string): Observable<any> {
    return this.http.post<any>(
      `http://localhost:8080/api/projects/${projectId}/collaborators?email=${email}&role=${role}`,
      {}, { withCredentials: true }
    );
  }

  removeInvitation(invitationId: string): Observable<any> {
    return this.http.delete(
      `http://localhost:8080/api/invitations/${invitationId}`,
      { withCredentials: true }
    );
  }

  setInvitations(invitations: any[]): void {
    this.invitationsSubject.next(invitations || []);
  }
}
