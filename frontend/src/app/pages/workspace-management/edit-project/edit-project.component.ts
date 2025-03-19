import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {TaskAssignmentComponent} from '../task-assignment/task-assignment.component';
import {UserInvitationComponent} from '../user-invitation/user-invitation.component';
import {TaskCreationComponent} from '../task-creation/task-creation-component';

@Component({
  selector: 'app-edit-project',
  imports: [CommonModule, FormsModule, TaskAssignmentComponent, UserInvitationComponent, TaskCreationComponent],
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.css']
})
export class EditProjectComponent implements OnInit {
  project: any = null;
  collaborators: any[] = [];
  tasks: any[] = [];
  errorMessage: string | null = null;
  currentUserRole: string = 'USER';
  userId!: string;
  editingProject: any = null;
  timerStates: { [taskId: string]: boolean } = {};
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
      this.fetchCollaborators(projectId);
      this.fetchTasks(projectId);
      this.fetchCurrentUserRole(projectId);
    }

    this.http.get<any>('http://localhost:8080/api/auth/dashboard', { withCredentials: true })
      .subscribe(
        (response) => {
          this.userId = response.userId;
        },
        (error) => {
          console.error('Error fetching user ID', error);
        }
      );
  }

  fetchProject(projectId: string): void {
    this.loading = true;
    this.http.get<any>(`http://localhost:8080/api/projects/${projectId}`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.project = response;
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

  fetchTasks(projectId: string): void {
    this.http.get<any[]>(`http://localhost:8080/api/tasks/project/${projectId}?assignedUserId=${this.userId}`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.tasks = response;
        },
        (error) => {
          console.error('Error fetching tasks', error);
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
          console.error('Error fetching current user role', error);
        }
      );
  }

  saveEdit(): void {
    this.http.put<any>(`http://localhost:8080/api/projects/${this.project.id}`, this.project, { withCredentials: true })
      .subscribe(
        (response) => {
          this.project = response;
          this.editingProject = null;
          this.errorMessage = null;
        },
        (error) => {
          console.error('Error updating project', error);
          this.errorMessage = 'Failed to update project. Please try again.';
        }
      );
  }

  addCollaborator(email: string, role: string): void {
    this.http.post<any>(
      `http://localhost:8080/api/projects/${this.project.id}/collaborators?email=${email}&role=${role}`,
      {}, { withCredentials: true }
    ).subscribe(
      () => {
        alert('Collaborator added!');
        this.fetchCollaborators(this.project.id);
      },
      (error) => {
        console.error('Error adding collaborator', error);
        this.errorMessage = 'Failed to add collaborator.';
      }
    );
  }

  createTask(name: string, description: string): void {
    const task = {
      name: name,
      description: description,
      status: 'PENDING'
    };

    this.http.post<any>(
      `http://localhost:8080/api/tasks?projectId=${this.project.id}`,
      task,
      { withCredentials: true }
    ).subscribe(
      (response) => {
        alert('Task created successfully!');
        this.fetchTasks(this.project.id);
      },
      (error) => {
        console.error('Error creating task', error);
      }
    );
  }

  assignTask(taskId: string, userId: string): void {
    this.http.post<any>(
      `http://localhost:8080/api/tasks/${taskId}/assign?userId=${userId}&assignedBy=${this.userId}`,
      {}, { withCredentials: true }
    ).subscribe(
      (response) => {
        alert('Task assigned successfully!');
        this.fetchTasks(this.project.id);
      },
      (error) => {
        console.error('Error assigning task', error);
      }
    );
  }

  roleHierarchy: { [key: string]: string[] } = {
    'OWNER': ['ADMIN', 'MANAGER', 'USER'],
    'ADMIN': ['MANAGER', 'USER'],
    'MANAGER': ['USER'],
    'USER': []
  };

  canManageRole(targetRole: string): boolean {
    return this.roleHierarchy[this.currentUserRole]?.includes(targetRole);
  }

  getAssignableRoles(): string[] {
    return this.roleHierarchy[this.currentUserRole] || [];
  }

  canAssignTasks(): boolean {
    const allowedRoles = ['ADMIN', 'OWNER', 'MANAGER'];
    return allowedRoles.includes(this.currentUserRole);
  }
}
