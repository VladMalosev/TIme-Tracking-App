import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-edit-project',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.css']
})
export class EditProjectComponent implements OnInit {
  project: any = null;
  errorMessage: string | null = null;
  currentUserRole: string = 'USER';
  loading: boolean = true;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      this.fetchProject(projectId);
      this.fetchCurrentUserRole(projectId);
    }
  }

  fetchProject(projectId: string): void {
    this.loading = true;
    this.http.get<any>(`http://localhost:8080/api/projects/${projectId}`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.project = response;
          if (this.project.deadline) {
            this.project.deadline = new Date(this.project.deadline);
          }
          this.loading = false;
          this.errorMessage = null;
        },
        (error) => {
          console.error('Error fetching project', error);
          this.errorMessage = 'Failed to fetch project. Please try again.';
          this.loading = false;
          this.router.navigate(['/workspace']);
        }
      );
  }

  fetchCurrentUserRole(projectId: string): void {
    this.http.get<{ role: string }>(`http://localhost:8080/api/auth/current-user-role/${projectId}`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.currentUserRole = response.role;
        },
        (error) => {
          if (error.error === 'User is not a collaborator on this project') {
            this.errorMessage = 'You are not a collaborator on this project.';
          } else {
            console.error('Error fetching current user role', error);
          }
        }
      );
  }

  saveEdit(): void {
    if (this.currentUserRole !== 'OWNER' && this.currentUserRole !== 'ADMIN') {
      this.errorMessage = 'You do not have permission to edit this project.';
      return;
    }

    this.http.put<any>(`http://localhost:8080/api/projects/${this.project.id}/edit`, this.project, { withCredentials: true })
      .subscribe(
        (response) => {
          this.project = response;
          this.errorMessage = null;
          alert('Project updated successfully!');
          this.router.navigate(['/projects', this.project.id]);
        },
        (error) => {
          console.error('Error updating project', error);
          this.errorMessage = error.error?.message || 'Failed to update project. Please try again.';
        }
      );
  }
}
