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
  tasks: any[] = [];
  constructor(private http: HttpClient) {}
  userId!: string;
  selectedTask: any = null;
  timeLogs: any[] = [];
  isRunning: boolean = false;
  startTime: Date | null = null;
  elapsedTime: number = 0;
  timerInterval: any;



  ngOnInit(): void {
    this.fetchProjects();

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

  selectTask(task: any): void {
    this.selectedTask = task;
    this.fetchTimeLogs(task.id);
  }

  fetchTimeLogs(taskId: string): void {
    this.http.get<any[]>(`http://localhost:8080/api/timelogs/task/${taskId}`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.timeLogs = response;
        },
        (error) => {
          console.error('Error fetching time logs', error);
        }
      );
  }

  logTime(taskId: string, hours: number, description: string): void {
    this.http.post<any>(
      `http://localhost:8080/api/timelogs`,
      {
        taskId: taskId,
        userId: this.userId,
        hours: hours,
        description: description,
      },
      { withCredentials: true }
    ).subscribe(
      (response) => {
        alert('Time logged successfully!');
        this.fetchTimeLogs(taskId);
      },
      (error) => {
        console.error('Error logging time', error);
      }
    );
  }

  updateTaskStatus(taskId: string, status: string): void {
    this.http.put<any>(
      `http://localhost:8080/api/tasks/${taskId}/status?status=${status}`,
      {}, // No request body needed
      { withCredentials: true }
    ).subscribe(
      (response) => {
        alert('Task status updated successfully!');
        this.fetchTasks(this.selectedProject.id);

        if (status === 'IN_PROGRESS') {
          this.startTimer();
        } else if (status === 'COMPLETED') {
          this.stopTimer();
        }
      },
      (error) => {
        console.error('Error updating task status', error);
      }
    );
  }

  startTimer(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.startTime = new Date();
      this.timerInterval = setInterval(() => {
        this.elapsedTime = Math.floor((new Date().getTime() - this.startTime!.getTime()) / 1000);
      }, 1000);
    }
  }

  stopTimer(): void {
    if (this.isRunning) {
      this.isRunning = false;
      clearInterval(this.timerInterval);
      this.elapsedTime = 0;
    }
  }

  canRemoveCollaborator(targetRole: string): boolean {
    return this.canManageRole(targetRole);
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

          this.ownedProjects.forEach(project => this.fetchCollaborators(project.id));
          this.collaboratedProjects.forEach(project => this.fetchCollaborators(project.id));
        },
        (error) => {
          console.error('Error fetching projects', error);
          this.errorMessage = 'Failed to fetch projects. Please try again.';
        }
      );
  }

  fetchTasks(projectId: string): void {
    this.http.get<any[]>(`http://localhost:8080/api/tasks/project/${projectId}?assignedUserId=${this.userId}`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.tasks = response;
          console.log('Fetched tasks:', this.tasks);
        },
        (error) => {
          console.error('Error fetching tasks', error);
        }
      );
  }

  assignTask(taskId: string, userId: string, assignedBy: string): void {
    this.http.post<any>(
      `http://localhost:8080/api/tasks/${taskId}/assign?userId=${userId}&assignedBy=${assignedBy}`,
      {}, { withCredentials: true }
    ).subscribe(
      (response) => {
        alert('Task assigned successfully!');
        console.log('Assigned Task Response:', response);
        this.fetchTasks(this.selectedProject.id);
      },
      (error) => {
        console.error('Error assigning task', error);
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
    if (!this.getAssignableRoles().includes(role)) {
      this.errorMessage = 'You do not have permission to assign this role.';
      return;
    }

    if (this.collaborators.some(collaborator => collaborator.user.email === email)) {
      this.errorMessage = 'Collaborator already exists.';
      return;
    }

    this.http.post<any>(
      `http://localhost:8080/api/projects/${projectId}/collaborators?email=${email}&role=${role}`,
      {}, { withCredentials: true }
    ).subscribe(
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

  createTask(projectId: string, name: string, description: string): void {
    const task = {
      name: name,
      description: description,
      status: 'PENDING'
    };

    this.http.post<any>(
      `http://localhost:8080/api/tasks?projectId=${projectId}`,
      task,
      { withCredentials: true }
    ).subscribe(
      (response) => {
        alert('Task created successfully!');
        this.fetchTasks(projectId);
      },
      (error) => {
        console.error('Error creating task', error);
      }
    );
  }

  canAssignTasks(): boolean {
    const allowedRoles = ['ADMIN', 'OWNER', 'MANAGER'];
    return allowedRoles.includes(this.currentUserRole);
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
      this.fetchTasks(project.id);
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
  canManageTask(task: any): boolean {
    return task.assignedUserId === this.userId || this.canManageRole('USER');
  }

  deleteTask(taskId: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.http.delete(`http://localhost:8080/api/tasks/${taskId}`, { withCredentials: true })
        .subscribe(
          () => {
            alert('Task deleted successfully!');
            this.fetchTasks(this.selectedProject.id);
          },
          (error) => {
            console.error('Error deleting task', error);
            alert('Failed to delete task. Please try again.');
          }
        );
    }
  }


  protected readonly Number = Number;



}
