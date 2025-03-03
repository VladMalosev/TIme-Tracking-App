import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-workspace-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './workspace-management.component.html',
  styleUrls: ['./workspace-management.component.css']
})


export class WorkspaceManagementComponent implements OnInit {
  ownedProjects: any[] = [];
  collaboratedProjects: any[] = [];
  newProject = { name: '', description: '' };
  errorMessage: string | null = null;
  collaborators: any[] = [];
  editingProject: any = null;
  selectedProject: any = null;
  currentUserRole: string = 'USER';
  constructor(private http: HttpClient) {}




  ngOnInit(): void {
    this.fetchProjects();

  }

  fetchCurrentUserRole(projectId: string): void {
    this.http.get<{ role: string }>(`http://localhost:8080/api/auth/current-user-role/${projectId}`, { withCredentials: true })
      .subscribe(
        (response) => {
          console.log('Current User Role:', response.role);
          this.currentUserRole = response.role;
        },
        (error) => {
          console.error('Error fetching current user role', error);
        }
      );
  }

  fetchProjects(): void {
    this.http.get<{ ownedProjects: any[], collaboratedProjects: any[] }>('http://localhost:8080/api/projects', { withCredentials: true })
      .subscribe(
        (response) => {
          this.ownedProjects = response.ownedProjects;
          this.collaboratedProjects = response.collaboratedProjects;
          this.errorMessage = null;

          // Fetch collaborators for each project
          this.ownedProjects.forEach(project => this.fetchCollaborators(project.id));
          this.collaboratedProjects.forEach(project => this.fetchCollaborators(project.id));
        },
        (error) => {
          console.error('Error fetching projects', error);
          this.errorMessage = 'Failed to fetch projects. Please try again.';
        }
      );
  }

  createProject(): void {
    this.http.post<any>('http://localhost:8080/api/projects', this.newProject, { withCredentials: true })
      .subscribe(
        (response) => {
          this.ownedProjects.push(response);
          this.newProject = { name: '', description: '' }
          this.errorMessage = null;
        },
        (error) => {
          console.error('Error creating project', error);
          this.errorMessage = 'Failed to create project. Please try again.';
        }
      );
  }

  deleteProject(projectId: string): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.http.delete(`http://localhost:8080/api/projects/${projectId}`, { withCredentials: true })
        .subscribe(
          () => {
            this.ownedProjects = this.ownedProjects.filter(p => p.id !== projectId);
            this.errorMessage = null;
          },
          (error) => {
            console.error('Error deleting project', error);
            this.errorMessage = 'Failed to delete project. Please try again.';
          }
        );
    }
  }

  editProject(project: any): void {
    this.http.put<any>(`http://localhost:8080/api/projects/${project.id}`, project, { withCredentials: true })
      .subscribe(
        (response) => {
          const index = this.ownedProjects.findIndex(p => p.id === project.id);
          if (index !== -1) {
            this.ownedProjects[index] = response;
          } else {
            const index = this.collaboratedProjects.findIndex(p => p.id === project.id);
            if (index !== -1) {
              this.collaboratedProjects[index] = response;
            }
          }
          this.errorMessage = null;
        },
        (error) => {
          console.error('Error updating project', error);
          this.errorMessage = 'Failed to update project. Please try again.';
        }
      );
  }

  addCollaborator(projectId: string, email: string, role: string): void {
    if (this.collaborators.some(collaborator => collaborator.user.email === email)) {
      this.errorMessage = 'Collaborator already exists.';
      return;
    }

    this.http.post<any>(
      `http://localhost:8080/api/projects/${projectId}/collaborators?email=${email}&role=${role}`,
      {}, { withCredentials: true })
      .subscribe(
        () => {
          alert('Collaborator added!');
          this.fetchCollaborators(projectId);
        },
        (error) => {
          console.error('Error adding collaborator', error);
          this.errorMessage = 'Failed to add collaborator.';
        }
      );
  }

  removeCollaborator(projectId: string, email: string): void {
    this.http.delete(
      `http://localhost:8080/api/projects/${projectId}/collaborators?email=${email}`,
      { withCredentials: true })
      .subscribe(
        () => {
          alert('Collaborator removed!');
          this.fetchCollaborators(projectId);
        },
        (error) => {
          console.error('Error removing collaborator', error);
          this.errorMessage = 'Failed to remove collaborator.';
        }
      );
  }

  fetchCollaborators(projectId: string): void {
    this.http.get<any[]>(`http://localhost:8080/api/projects/${projectId}/collaborators`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.collaborators = response;
        },
        (error) => {
          console.error('Error fetching collaborators', error);
        }
      );
  }

  selectProject(project: any): void {
    if (this.selectedProject && this.selectedProject.id === project.id) {
      this.selectedProject = null;
    } else {
      this.selectedProject = project;
      this.fetchCollaborators(project.id);
      this.fetchCurrentUserRole(project.id);
    }
  }

  startEdit(project: any): void {
    this.editingProject = { ...project };
  }

  cancelEdit(project: any): void {
    this.editingProject = null;
  }

  isEditing(project: any): boolean {
    return this.editingProject && this.editingProject.id === project.id;
  }

  saveEdit(project: any): void {
    this.http.put<any>(`http://localhost:8080/api/projects/${project.id}`, project, { withCredentials: true })
      .subscribe(
        (response) => {
          const index = this.ownedProjects.findIndex(p => p.id === project.id);
          if (index !== -1) {
            this.ownedProjects[index] = response;
          } else {
            const index = this.collaboratedProjects.findIndex(p => p.id === project.id);
            if (index !== -1) {
              this.collaboratedProjects[index] = response;
            }
          }
          this.editingProject = null;
          this.errorMessage = null;
        },
        (error) => {
          console.error('Error updating project', error);
          this.errorMessage = 'Failed to update project. Please try again.';
        }
      );
  }

  canRemoveCollaborator(collaboratorRole: string): boolean {
    switch (this.currentUserRole) {
      case 'OWNER':
        return true;
      case 'ADMIN':
        return collaboratorRole === 'MANAGER' || collaboratorRole === 'USER';
      case 'MANAGER':
        return collaboratorRole === 'USER';
      default:
        return false;
    }
  }
}
