import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-invitations-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './invitations.component.html',
  styleUrl: './invitations.component.css'
})
export class InvitationsComponent implements OnInit {
  pendingInvitations: any[] = [];
  errorMessage: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchPendingInvitations();
  }

  fetchPendingInvitations(): void {
    this.http
      .get<any[]>('http://localhost:8080/api/invitations/pending', { withCredentials: true })
      .subscribe(
        (response) => {
          this.pendingInvitations = response;
        },
        (error) => {
          console.error('Error fetching pending invitations:', error);
          this.errorMessage = 'Failed to fetch pending invitations.';
        }
      );
  }

  acceptInvitation(invitationId: number): void {
    this.http
      .post(`http://localhost:8080/api/invitations/${invitationId}/accept`, {}, { withCredentials: true })
      .subscribe(
        () => {
          this.fetchPendingInvitations();
        },
        (error) => {
          console.error('Error accepting invitation:', error);
          this.errorMessage = 'Failed to accept invitation.';
        }
      );
  }

  rejectInvitation(invitationId: number): void {
    this.http
      .post(`http://localhost:8080/api/invitations/${invitationId}/reject`, {}, { withCredentials: true })
      .subscribe(
        () => {
          this.fetchPendingInvitations();
        },
        (error) => {
          console.error('Error rejecting invitation:', error);
          this.errorMessage = 'Failed to reject invitation.';
        }
      );
  }
}
