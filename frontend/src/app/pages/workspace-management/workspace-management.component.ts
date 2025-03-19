import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-workspace-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workspace-management.component.html',
  styleUrls: ['./workspace-management.component.css']
})
export class WorkspaceManagementComponent implements OnInit {
  ownedProjects: any[] = [];
  errorMessage: string | null = null;
  selectedOwnedProjects: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.fetchProjects();
  }

  goToProjectMembers(projectId: number): void {
    this.router.navigate(['/project-details', projectId]);
  }

  fetchProjects(): void {
    this.http.get<{ ownedProjects: any[] }>('http://localhost:8080/api/projects', { withCredentials: true })
      .subscribe(
        (response) => {
          console.log("API Response:", response); // Log response to verify

          if (!response || !response.ownedProjects) {
            this.errorMessage = 'Invalid API response: Missing ownedProjects data.';
            return;
          }

          this.ownedProjects = response.ownedProjects.map(project => ({
            ...project,
            selected: false,
            deadline: project.deadline ? new Date(project.deadline) : null
          }));

          console.log("Owned Projects:", this.ownedProjects);
          this.errorMessage = null;
        },
        (error) => {
          console.error('Error fetching projects', error);
          this.errorMessage = 'Failed to fetch projects. Please try again.';
        }
      );
  }


  toggleSelectAllOwned(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
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

  startEdit(project: any): void {
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
}
