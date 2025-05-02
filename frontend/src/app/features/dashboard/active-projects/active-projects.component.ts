import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ProjectService } from '../../../services/main-dashboard/project.service';

@Component({
  selector: 'app-active-projects',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './active-projects.component.html',
  styleUrls: ['./active-projects.component.css']
})
export class ActiveProjectsComponent implements OnInit {
  projects: any[] = [];
  isLoading = true;
  error: string | null = null;
  displayedProjects = 3;

  constructor(
    private projectService: ProjectService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fetchActiveProjects();
  }

  fetchActiveProjects(): void {
    this.isLoading = true;
    this.error = null;

    this.authService.userId$.subscribe(userId => {
      if (userId) {
        this.projectService.getUserProjects(userId).subscribe({
          next: (response: any) => {
            this.projects = (response.projects || []).map((project: any) => {
              return {
                ...project,
                createdAt: new Date(project.createdAt),
                dueDate: project.dueDate ? new Date(project.dueDate) : null,
                showFullDescription: false
              };
            });
            this.isLoading = false;
          },
          error: (err) => {
            this.error = 'Failed to fetch projects';
            this.isLoading = false;
            console.error('Error fetching projects:', err);
          }
        });
      } else {
        this.isLoading = false;
        this.error = 'User not authenticated';
      }
    });
  }

  getProgress(createdAt: Date, dueDate: Date): number {
    if (!createdAt || !dueDate) return 0;

    const now = new Date();
    const start = new Date(createdAt).getTime();
    const end = new Date(dueDate).getTime();
    const current = now.getTime();

    if (current >= end) return 100;
    if (current <= start) return 0;

    return Math.round(((current - start) / (end - start)) * 100);
  }
}
