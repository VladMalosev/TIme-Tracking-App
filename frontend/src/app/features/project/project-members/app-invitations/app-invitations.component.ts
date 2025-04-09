import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { map, Observable } from 'rxjs';
import {InvitationsService} from '../../../../services/project-tasks/invitations.service';

@Component({
  selector: 'app-app-invitations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatMenuModule,
    MatSnackBarModule
  ],
  templateUrl: './app-invitations.component.html',
  styleUrls: ['./app-invitations.component.scss']
})
export class AppInvitationsComponent implements OnInit {
  errorMessage: string | null = null;
  selectedRole: string | null = null;
  collaboratorEmail: string = '';
  currentUserRole: string = '';
  assignableRoles: string[] = [];
  displayedColumns: string[] = ['email', 'name', 'role', 'status', 'sentBy', 'sentAt', 'actions'];
  invitations$: Observable<any[]>;

  constructor(
    private invitationsService: InvitationsService,
    private snackBar: MatSnackBar
  ) {
    this.invitations$ = this.invitationsService.invitations$.pipe(
      map(invitations => invitations || [])
    );
  }

  ngOnInit(): void {
    this.invitationsService.currentUserRole$.subscribe(role => {
      this.currentUserRole = role;
      this.assignableRoles = this.getAssignableRoles();
    });

    this.loadInvitations();
  }

  loadInvitations(): void {
    this.invitationsService.projectId$.subscribe(projectId => {
      if (!projectId) return;

      this.invitationsService.loadInvitations(projectId).subscribe({
        next: (data) => {
          this.invitationsService.setInvitations(
            (data || []).sort((a, b) => {
              if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
              if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
              return 0;
            })
          );
        },
        error: (error) => {
          console.error('Error fetching invitations', error);
        }
      });
    });
  }

  addCollaborator(): void {
    if (!this.selectedRole) {
      this.errorMessage = 'Please select a role.';
      return;
    }

    this.invitationsService.projectId$.subscribe(projectId => {
      if (!projectId) return;

      this.invitationsService.addCollaborator(projectId, this.collaboratorEmail, this.selectedRole!).subscribe({
        next: () => {
          this.snackBar.open('Invitation sent successfully!', 'Close', { duration: 3000 });
          this.errorMessage = null;
          this.selectedRole = null;
          this.collaboratorEmail = '';
          this.loadInvitations();
        },
        error: (error) => {
          console.error('Error sending invitation', error);
          this.errorMessage = error.error?.message || 'Failed to send invitation.';
        }
      });
    });
  }

  removeInvitation(invitationId: string): void {
    if (confirm('Are you sure you want to remove this invitation?')) {
      this.invitationsService.removeInvitation(invitationId).subscribe({
        next: () => {
          this.snackBar.open('Invitation removed successfully!', 'Close', { duration: 3000 });
          this.loadInvitations();
        },
        error: (error) => {
          console.error('Error removing invitation', error);
          this.errorMessage = error.status === 400
            ? 'Invitation is not pending and cannot be deleted.'
            : 'Failed to remove invitation.';
        }
      });
    }
  }

  getAssignableRoles(): string[] {
    const roleHierarchy: { [key: string]: string[] } = {
      'OWNER': ['ADMIN', 'MANAGER', 'USER'],
      'ADMIN': ['MANAGER', 'USER'],
      'MANAGER': ['USER'],
      'USER': []
    };
    return roleHierarchy[this.currentUserRole] || [];
  }
}
