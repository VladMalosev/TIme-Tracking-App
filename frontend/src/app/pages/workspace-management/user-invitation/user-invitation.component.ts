import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {RoleDropdownComponent} from './role-dropdown/role-dropdown.component';

@Component({
  selector: 'app-user-invitation',
  standalone: true,
  imports: [CommonModule, FormsModule, RoleDropdownComponent],
  templateUrl: './user-invitation.component.html',
  styleUrls: ['./user-invitation.component.css']
})
export class UserInvitationComponent implements OnInit {
  @Input() projectId!: string;
  @Input() currentUserRole!: string;
  errorMessage: string | null = null;
  selectedRole: string | null = null;


  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

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
      },
      (error) => {
        console.error('Error adding collaborator', error);
        this.errorMessage = 'Failed to add collaborator.';
      }
    );
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
