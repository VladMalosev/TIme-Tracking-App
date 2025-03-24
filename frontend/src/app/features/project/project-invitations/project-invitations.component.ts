import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleDropdownComponent } from './role-dropdown/role-dropdown.component';

@Component({
  selector: 'app-project-invitations',
  imports: [FormsModule, CommonModule, NgIf, RoleDropdownComponent],
  templateUrl: './project-invitations.component.html',
  styleUrls: ['./project-invitations.component.css']
})
export class ProjectInvitationsComponent implements OnInit {
  @Input() projectId!: string;
  @Input() currentUserRole!: string;
  errorMessage: string | null = null;
  selectedRole: string | null = null;
  invitations: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadInvitations();
  }

  loadInvitations(): void {
    this.http.get<any[]>(`http://localhost:8080/api/invitations/project/${this.projectId}`, { withCredentials: true })
      .subscribe(
        (data) => {
          console.log('Fetched invitations:', data);
          this.invitations = data.sort((a, b) => {
            if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
            if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
            return 0;
          });
        },
        (error) => {
          console.error('Error fetching invitations', error);
        }
      );
  }

  onRoleSelected(role: string): void {
    this.selectedRole = role;
  }

  addCollaborator(email: string, role: string | null): void {
    if (!role) {
      this.errorMessage = 'Please select a role.';
      return;
    }

    this.http.post<any>(
      `http://localhost:8080/api/projects/${this.projectId}/collaborators?email=${email}&role=${role}`,
      {}, { withCredentials: true }
    ).subscribe(
      () => {
        alert('Collaborator added!');
        this.errorMessage = null;
        this.selectedRole = null;
        this.loadInvitations();
      },
      (error) => {
        console.error('Error adding collaborator', error);
        this.errorMessage = 'Failed to add collaborator.';
      }
    );
  }

  removeInvitation(invitationId: string): void {
    console.log('Invitation ID:', invitationId);
    if (!invitationId) {
      this.errorMessage = 'Invalid invitation ID.';
      return;
    }

    if (confirm('Are you sure you want to remove this invitation?')) {
      this.http.delete(`http://localhost:8080/api/invitations/${invitationId}`, { withCredentials: true })
        .subscribe(
          () => {
            alert('Invitation removed successfully!');
            this.loadInvitations();
          },
          (error) => {
            console.error('Error removing invitation', error);
            if (error.status === 400) {
              this.errorMessage = 'Invitation is not pending and cannot be deleted.';
            } else {
              this.errorMessage = 'Failed to remove invitation.';
            }
          }
        );
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
