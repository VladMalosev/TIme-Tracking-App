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
  collaboratedProjects: any[] = [];
  errorMessage: string | null = null;
  selectedOwnedProjects: any[] = [];
  selectedCollaboratedProjects: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.fetchProjects();
  }

  goToProjectMembers(projectId: number): void {
    this.router.navigate(['/project-details', projectId]);
  }

  fetchProjects(): void {
    this.http.get<{ ownedProjects: any[], collaboratedProjects: any[] }>('http://localhost:8080/api/projects', { withCredentials: true })
      .subscribe(
        (response) => {
          this.ownedProjects = response.ownedProjects.map(project => ({
            ...project,
            selected: false,
            deadline: project.deadline ? new Date(project.deadline) : null
          }));
          this.collaboratedProjects = response.collaboratedProjects.map(project => ({
            ...project,
            selected: false,
            deadline: project.deadline ? new Date(project.deadline) : null
          }));
          console.log("Collaborated projects:", this.collaboratedProjects);
          console.log("Owned projects:", this.ownedProjects);

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

  toggleSelectAllCollaborated(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.collaboratedProjects.forEach(project => project.selected = isChecked);
    this.updateSelectedCollaboratedProjects();
  }

  updateSelectedOwnedProjects(): void {
    this.selectedOwnedProjects = this.ownedProjects.filter(project => project.selected);
    console.log('Selected Owned Projects:', this.selectedOwnedProjects);
  }

  updateSelectedCollaboratedProjects(): void {
    this.selectedCollaboratedProjects = this.collaboratedProjects.filter(project => project.selected);
    console.log('Selected Collaborated Projects:', this.selectedCollaboratedProjects);
  }

  deleteSelectedProjects(type: 'owned' | 'collaborated'): void {
    const selectedIds = type === 'owned'
      ? this.selectedOwnedProjects.map(project => project.id)
      : this.selectedCollaboratedProjects.map(project => project.id);

    console.log('Selected IDs:', selectedIds);

    if (selectedIds.length === 0) {
      this.errorMessage = 'No projects selected.';
      return;
    }

    if (confirm(`Are you sure you want to delete the selected ${type} projects?`)) {
      selectedIds.forEach(projectId => {
        this.http.delete(`http://localhost:8080/api/projects/${projectId}`, { withCredentials: true })
          .subscribe(
            () => {
              if (type === 'owned') {
                this.ownedProjects = this.ownedProjects.filter(project => project.id !== projectId);
              } else {
                this.collaboratedProjects = this.collaboratedProjects.filter(project => project.id !== projectId);
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
      } else {
        this.selectedCollaboratedProjects = [];
      }
    }
  }

  deleteProject(projectId: string): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.http.delete(`http://localhost:8080/api/projects/${projectId}`, { withCredentials: true })
        .subscribe(
          () => {
            this.ownedProjects = this.ownedProjects.filter(project => project.id !== projectId);
            this.collaboratedProjects = this.collaboratedProjects.filter(project => project.id !== projectId);
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
    this.router.navigate(['/edit-project', project.id]);
  }

}
