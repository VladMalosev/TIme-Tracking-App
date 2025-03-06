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
  startTime: Date | null = null;
  manualStartTime: string = '';
  manualEndTime: string = '';
  manualDescription: string = '';
  taskCompletionDetails: any = null;
  timerStates: { [taskId: string]: boolean } = {};

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


  startTask(taskId: string): void {
    this.timerStates[taskId] = true;
    this.startTimer(taskId, this.userId, 'Task started');
  }

  stopTask(taskId: string): void {
    this.timerStates[taskId] = false;
    this.stopTimer(taskId, this.userId);
  }


  completeTask(taskId: string): void {
    this.updateTaskStatus(taskId, 'COMPLETED');
  }


  roleHierarchy: { [key: string]: string[] } = {
    'OWNER': ['ADMIN', 'MANAGER', 'USER'],
    'ADMIN': ['MANAGER', 'USER'],
    'MANAGER': ['USER'],
    'USER': []
  };
  getActiveTasks(): any[] {
    return this.tasks.filter(task => task.status !== 'COMPLETED');
  }
  getCompletedTasks(): any[] {
    return this.tasks.filter(task => task.status === 'COMPLETED');
  }

  fetchTimeLogs(taskId: string, userId: string): void {
    this.http.get<any[]>(`http://localhost:8080/api/timelogs/user/${userId}/task/${taskId}`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.timeLogs = response;
        },
        (error) => {
          console.error('Error fetching time logs', error);
        }
      );
  }

  selectTask(task: any): void {
    if (this.selectedTask && this.selectedTask.id === task.id) {
      this.selectedTask = null;
    } else {
      this.selectedTask = task;
      this.fetchTimeLogs(task.id, this.userId);
    }
  }

  createManualTimeLog(taskId: string, userId: string, startTime: string, endTime: string, description: string): void {
    const requestBody = {
      userId: userId,
      taskId: taskId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      description: description
    };

    this.http.post<any>(`http://localhost:8080/api/timelogs/manual`, requestBody, { withCredentials: true })
      .subscribe(
        (response) => {
          console.log('Manual time log created:', response);
          this.fetchTimeLogs(taskId, userId); // Refresh time logs after adding a new one
        },
        (error) => {
          console.error('Error creating manual time log', error);
        }
      );
  }


  canManageRole(targetRole: string): boolean {
    return this.roleHierarchy[this.currentUserRole]?.includes(targetRole);
  }
  getAssignableRoles(): string[] {
    return this.roleHierarchy[this.currentUserRole] || [];
  }


  calculateTotalTime(): number {
    return this.timeLogs.reduce((total, log) => {
      const start = new Date(log.startTime);
      const end = new Date(log.endTime);
      return total + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);
  }

  updateTaskStatus(taskId: string, status: string): void {
    if (status === 'IN_PROGRESS') {
      if (!this.timerStates[taskId]) {
        this.timerStates[taskId] = true;
        this.startTimer(taskId, this.userId, 'Task started');
      }
    } else if (status === 'COMPLETED') {
      if (this.timerStates[taskId]) {
        this.timerStates[taskId] = false;
        this.stopTimer(taskId, this.userId);
      }
    }
    this.http.put<any>(
      `http://localhost:8080/api/tasks/${taskId}/status?status=${status}`,
      {},
      { withCredentials: true }
    ).subscribe(
      (response) => {
        alert('Task status updated successfully!');
        this.fetchTasks(this.selectedProject.id);
      },
      (error) => {
        console.error('Error updating task status', error);
      }
    );
  }


  startTimer(taskId: string, userId: string, description: string): void {
    const requestBody = {
      userId: userId,
      taskId: taskId,
      description: description
    };

    this.http.post<any>(`http://localhost:8080/api/timelogs/start`, requestBody, { withCredentials: true })
      .subscribe(
        (response) => {
          console.log('Timer started:', response);
        },
        (error) => {
          console.error('Error starting timer', error);
        }
      );
  }

  stopTimer(taskId: string, userId: string): void {
    const requestBody = {
      userId: userId,
      taskId: taskId
    };

    this.http.post<any>(`http://localhost:8080/api/timelogs/stop`, requestBody, { withCredentials: true })
      .subscribe(
        (response) => {
          console.log('Timer stopped:', response);
        },
        (error) => {
          console.error('Error stopping timer', error);
        }
      );
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
    const task = this.tasks.find(t => t.id === taskId);
    if (task && task.status === 'COMPLETED') {
      alert('Cannot assign a completed task.');
      return;
    }

    this.http.post<any>(
      `http://localhost:8080/api/tasks/${taskId}/assign?userId=${userId}&assignedBy=${assignedBy}`,
      {}, { withCredentials: true }
    ).subscribe(
      (response) => {
        alert('Task assigned successfully!');
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
      this.fetchTasks(project.id);
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

  closeTaskCompletionDetails(): void {
    this.taskCompletionDetails = null;
  }

  fetchTaskCompletionDetails(taskId: string): void {
    this.http.get<any>(`http://localhost:8080/api/tasks/${taskId}/completion-details`, { withCredentials: true })
      .subscribe(
        (response) => {
          console.log('Task completion details:', response);
          this.taskCompletionDetails = response;
        },
        (error) => {
          console.error('Error fetching task completion details', error);
        }
      );
  }


  protected readonly Number = Number;



}
