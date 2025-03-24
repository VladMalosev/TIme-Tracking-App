import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-invitations-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './invitations.component.html',
  styleUrl: './invitations.component.css'
})
export class InvitationsComponent implements OnInit {
  pendingProjectInvitations: any[] = [];
  pendingWorkspaceInvitations: any[] = [];
  errorMessage: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchPendingProjectInvitations();
    this.fetchPendingWorkspaceInvitations();
  }

  fetchPendingProjectInvitations(): void {
    this.http
      .get<any[]>('http://localhost:8080/api/invitations/pending', { withCredentials: true })
      .subscribe(
        (response) => {
          this.pendingProjectInvitations = response;
        },
        (error) => {
          console.error('Error fetching pending project invitations:', error);
          this.errorMessage = 'Failed to fetch pending project invitations.';
        }
      );
  }

  fetchPendingWorkspaceInvitations(): void {
    this.http
      .get<any[]>('http://localhost:8080/api/workspaces/invitations/pending', { withCredentials: true })
      .subscribe(
        (response) => {
          this.pendingWorkspaceInvitations = response;
        },
        (error) => {
          console.error('Error fetching pending workspace invitations:', error);
          this.errorMessage = 'Failed to fetch pending workspace invitations.';
        }
      );
  }


  acceptProjectInvitation(invitationId: number): void {
    this.http
      .post(`http://localhost:8080/api/invitations/${invitationId}/accept`, {}, { withCredentials: true })
      .subscribe(
        () => {
          this.fetchPendingProjectInvitations();
        },
        (error) => {
          console.error('Error accepting project invitation:', error);
          this.errorMessage = 'Failed to accept project invitation.';
        }
      );
  }

  rejectProjectInvitation(invitationId: number): void {
    this.http
      .post(`http://localhost:8080/api/invitations/${invitationId}/reject`, {}, { withCredentials: true })
      .subscribe(
        () => {
          this.fetchPendingProjectInvitations();
        },
        (error) => {
          console.error('Error rejecting project invitation:', error);
          this.errorMessage = 'Failed to reject project invitation.';
        }
      );
  }

  acceptWorkspaceInvitation(invitationId: number): void {
    this.http
      .post(`http://localhost:8080/api/workspaces/invitations/${invitationId}/accept`, {}, { withCredentials: true })
      .subscribe(
        () => {
          this.fetchPendingWorkspaceInvitations();
        },
        (error) => {
          console.error('Error accepting workspace invitation:', error);
          this.errorMessage = 'Failed to accept workspace invitation.';
        }
      );
  }

  rejectWorkspaceInvitation(invitationId: number): void {
    this.http
      .post(`http://localhost:8080/api/workspaces/invitations/${invitationId}/reject`, {}, { withCredentials: true })
      .subscribe(
        () => {
          this.fetchPendingWorkspaceInvitations();
        },
        (error) => {
          console.error('Error rejecting workspace invitation:', error);
          this.errorMessage = 'Failed to reject workspace invitation.';
        }
      );
  }

}
