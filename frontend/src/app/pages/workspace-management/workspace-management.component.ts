import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

interface Workspace {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status?: string;
  createdAt: string;
  deadline?: Date | null;
  workspaceId: string;
  selected?: boolean;
}

@Component({
  selector: 'app-workspace-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatTableModule,
  ],
  templateUrl: './workspace-management.component.html',
  styleUrls: ['./workspace-management.component.scss'],
})
export class WorkspaceManagementComponent implements OnInit {
  ownedProjects: Project[] = [];
  collaboratedProjects: Project[] = [];
  errorMessage: string | null = null;
  selectedOwnedProjects: Project[] = [];
  workspaces: Workspace[] = [];
  selectedWorkspaceId: string | null = null;
  inviteUserEmail: string = '';
  inviteUserRole: string = 'USER';
  inviteUserDescription: string = '';
  showInviteUserForm: boolean = false;

  constructor(private http: HttpClient, private router: Router, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.fetchWorkspaces();
  }

  toggleInviteUserForm(): void {
    this.showInviteUserForm = !this.showInviteUserForm;
  }

  goToProjectMembers(projectId: number): void {
    this.router.navigate(['/project-details', projectId]);
  }

  fetchWorkspaces(): void {
    this.http
      .get<{ workspaces: Workspace[] }>('http://localhost:8080/api/workspaces', { withCredentials: true })
      .subscribe(
        (response) => {
          this.workspaces = response.workspaces;
          if (this.workspaces.length > 0) {
            this.selectedWorkspaceId = this.workspaces[0].id;
            this.fetchProjects();
            this.fetchCollaboratedProjects();
          }
        },
        (error) => {
          this.errorMessage = 'Failed to fetch workspaces. Please try again.';
        }
      );
  }

  fetchCollaboratedProjects(): void {
    this.http
      .get<Project[]>('http://localhost:8080/api/workspaces/collaborated-projects', { withCredentials: true })
      .subscribe(
        (response) => {
          this.collaboratedProjects = response;
        },
        (error) => {
          console.error('Failed to fetch collaborated projects', error);
        }
      );
  }

  onWorkspaceChange(): void {
    this.fetchProjects();
    this.fetchCollaboratedProjects();
  }

  fetchProjects(): void {
    if (!this.selectedWorkspaceId) {
      this.errorMessage = 'No workspace selected.';
      return;
    }

    this.http
      .get<Project[]>(`http://localhost:8080/api/workspaces/${this.selectedWorkspaceId}/projects`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.ownedProjects = response;
          this.errorMessage = null;
        },
        (error) => {
          this.errorMessage = 'Failed to fetch projects. Please try again.';
        }
      );
  }

  addNewProject(): void {
    this.router.navigate(['/add-project']);
  }

  toggleSelectAllOwned(event: MatCheckboxChange): void {
    const isChecked = event.checked;
    this.ownedProjects.forEach(project => project.selected = isChecked);
    this.updateSelectedOwnedProjects();
  }

  updateSelectedOwnedProjects(): void {
    this.selectedOwnedProjects = this.ownedProjects.filter(project => project.selected);
    console.log('Selected Owned Projects:', this.selectedOwnedProjects);
  }

  deleteSelectedProjects(type: 'owned' | 'collaborated'): void {
    const selectedIds = type === 'owned'
      ? this.selectedOwnedProjects.map(project => project.id)
      : [];

    console.log('Selected IDs:', selectedIds);

    if (selectedIds.length === 0 && type === 'owned') {
      this.errorMessage = 'No owned projects selected.';
      return;
    }
    if (selectedIds.length === 0 && type === 'collaborated') {
      this.errorMessage = 'No collaborated projects selected.';
      return;
    }

    if (confirm(`Are you sure you want to delete the selected ${type} projects?`)) {
      selectedIds.forEach(projectId => {
        this.http.delete(`http://localhost:8080/api/projects/${projectId}`, { withCredentials: true })
          .subscribe(
            () => {
              if (type === 'owned') {
                this.ownedProjects = this.ownedProjects.filter(project => project.id !== projectId);
              }
            },
            (error) => {
              console.error('Error deleting project', error);
              this.errorMessage = 'Failed to delete project. Please try again.';
            }
          );
      });

      if (type === 'owned') {
        this.selectedOwnedProjects = [];
      }
    }
  }

  deleteProject(projectId: string): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.http.delete(`http://localhost:8080/api/projects/${projectId}`, { withCredentials: true })
        .subscribe(
          () => {
            this.ownedProjects = this.ownedProjects.filter(project => project.id !== projectId);
            this.errorMessage = null;
          },
          (error) => {
            console.error('Error deleting project', error);
            this.errorMessage = 'Failed to delete project. Please try again.';
          }
        );
    }
  }

  startEdit(project: Project): void {
    this.http.get(`http://localhost:8080/api/projects/${project.id}/current-user-role`, { withCredentials: true })
      .subscribe(
        (response: any) => {
          const role = response.role;
          if (role === 'OWNER' || role === 'ADMIN') {
            // Allow editing
            this.router.navigate(['/edit-project', project.id]);
          } else {
            this.errorMessage = 'You do not have permission to edit this project.';
          }
        },
        (error) => {
          console.error('Error fetching user role', error);
          this.errorMessage = 'Failed to fetch user role. Please try again.';
        }
      );
  }

  inviteUserToWorkspace(): void {
    if (!this.selectedWorkspaceId || !this.inviteUserEmail || !this.inviteUserRole) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    const payload = {
      workspaceId: this.selectedWorkspaceId,
      email: this.inviteUserEmail,
      role: this.inviteUserRole,
      description: this.inviteUserDescription,
    };

    this.http.post('http://localhost:8080/api/workspaces/invite', payload, { withCredentials: true })
      .subscribe(
        () => {
          this.errorMessage = null;
          this.snackBar.open('User invited successfully!', 'Close', { duration: 3000 });
          this.inviteUserEmail = '';
          this.inviteUserRole = 'USER';
          this.inviteUserDescription = '';
          this.showInviteUserForm = false;
        },
        (error) => {
          console.error('Error inviting user', error);
          this.errorMessage = error.error?.message || 'Failed to invite user. Please try again.';
        }
      );
  }
}
