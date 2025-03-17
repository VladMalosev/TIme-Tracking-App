import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import {Router} from '@angular/router';

@Component({
  selector: 'app-workspace-management',
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './workspace-management.component.html',
  styleUrls: ['./workspace-management.component.css']
})
export class WorkspaceManagementComponent implements OnInit {
  ownedProjects: any[] = [];
  collaboratedProjects: any[] = [];
  errorMessage: string | null = null;
  selectedProjects: any[] = [];


  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.fetchProjects();
  }

  fetchProjects(): void {
    this.http.get<{ ownedProjects: any[], collaboratedProjects: any[] }>('http://localhost:8080/api/projects', { withCredentials: true })
      .subscribe(
        (response) => {
          this.ownedProjects = response.ownedProjects.map(project => ({
            ...project,
            selected: false,
            deadline: project.deadline ? new Date(project.deadline) : null // Ensure deadline is a Date object or null
          }));
          this.collaboratedProjects = response.collaboratedProjects.map(project => ({
            ...project,
            deadline: project.deadline ? new Date(project.deadline) : null // Ensure deadline is a Date object or null
          }));
          this.errorMessage = null;
        },
        (error) => {
          console.error('Error fetching projects', error);
          this.errorMessage = 'Failed to fetch projects. Please try again.';
        }
      );
  }

  toggleSelectAll(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.ownedProjects.forEach(project => project.selected = isChecked);
    this.updateSelectedProjects();
  }

  updateSelectedProjects(): void {
    this.selectedProjects = this.ownedProjects.filter(project => project.selected);
  }

  deleteSelectedProjects(): void {
    const selectedIds = this.selectedProjects.map(project => project.id);
    if (confirm('Are you sure you want to delete the selected projects?')) {
      this.http.post<any>('http://localhost:8080/api/projects/delete', { ids: selectedIds }, { withCredentials: true })
        .subscribe(
          () => {
            this.ownedProjects = this.ownedProjects.filter(project => !selectedIds.includes(project.id));
            this.selectedProjects = [];
          },
          (error) => {
            console.error('Error deleting projects', error);
            this.errorMessage = 'Failed to delete projects. Please try again.';
          }
        );
    }
  }

  deleteProject(projectId: string): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.http.delete(`http://localhost:8080/api/projects/${projectId}`, { withCredentials: true })
        .subscribe(
          () => {
            this.ownedProjects = this.ownedProjects.filter(project => project.id !== projectId);
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
