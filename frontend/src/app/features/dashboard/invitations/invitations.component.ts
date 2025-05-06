import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {ClientsComponent} from "../clients/clients.component";

@Component({
  selector: 'app-invitations',
  templateUrl: './invitations.component.html',
  styleUrls: ['./invitations.component.css'],
  standalone: true,
    imports: [
        NgFor,
        NgIf,
        NgClass,
        MatIconModule,
        MatButtonModule,
        ClientsComponent
    ]
})
export class InvitationsComponent implements OnInit {
  pendingProjectInvitations: any[] = [];
  pendingWorkspaceInvitations: any[] = [];
  errorMessage: string | null = null;
  activeTab: 'all' | 'projects' | 'workspaces' = 'all';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchPendingProjectInvitations();
    this.fetchPendingWorkspaceInvitations();
  }

  get totalInvitations(): number {
    return this.pendingProjectInvitations.length + this.pendingWorkspaceInvitations.length;
  }

  fetchPendingProjectInvitations(): void {
    this.http
      .get<any[]>('http://localhost:8080/api/invitations/pending', { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.pendingProjectInvitations = response;
        },
        error: (error) => {
          console.error('Error fetching pending project invitations:', error);
          this.errorMessage = 'Failed to fetch pending project invitations.';
        }
      });
  }

  fetchPendingWorkspaceInvitations(): void {
    this.http
      .get<any[]>('http://localhost:8080/api/workspaces/invitations/pending', { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.pendingWorkspaceInvitations = response;
        },
        error: (error) => {
          console.error('Error fetching pending workspace invitations:', error);
          this.errorMessage = 'Failed to fetch pending workspace invitations.';
        }
      });
  }

  acceptProjectInvitation(invitationId: number): void {
    this.http
      .post(`http://localhost:8080/api/invitations/${invitationId}/accept`, {}, { withCredentials: true })
      .subscribe({
        next: () => {
          this.fetchPendingProjectInvitations();
        },
        error: (error) => {
          console.error('Error accepting project invitation:', error);
          this.errorMessage = 'Failed to accept project invitation.';
        }
      });
  }

  rejectProjectInvitation(invitationId: number): void {
    this.http
      .post(`http://localhost:8080/api/invitations/${invitationId}/reject`, {}, { withCredentials: true })
      .subscribe({
        next: () => {
          this.fetchPendingProjectInvitations();
        },
        error: (error) => {
          console.error('Error rejecting project invitation:', error);
          this.errorMessage = 'Failed to reject project invitation.';
        }
      });
  }

  acceptWorkspaceInvitation(invitationId: number): void {
    this.http
      .post(`http://localhost:8080/api/workspaces/invitations/${invitationId}/accept`, {}, { withCredentials: true })
      .subscribe({
        next: () => {
          this.fetchPendingWorkspaceInvitations();
        },
        error: (error) => {
          console.error('Error accepting workspace invitation:', error);
          this.errorMessage = 'Failed to accept workspace invitation.';
        }
      });
  }

  rejectWorkspaceInvitation(invitationId: number): void {
    this.http
      .post(`http://localhost:8080/api/workspaces/invitations/${invitationId}/reject`, {}, { withCredentials: true })
      .subscribe({
        next: () => {
          this.fetchPendingWorkspaceInvitations();
        },
        error: (error) => {
          console.error('Error rejecting workspace invitation:', error);
          this.errorMessage = 'Failed to reject workspace invitation.';
        }
      });
  }
}
