import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {TaskLogComponent} from './tasklog/tasklog.component';

@Component({
  selector: 'app-project-tasks',
  imports: [CommonModule, FormsModule, TaskLogComponent],
  templateUrl: './project-tasks.component.html',
  styleUrl: './project-tasks.component.scss'
})
export class ProjectTasksComponent implements OnInit {
  @Input() projectId!: string;
  @Input() currentUserRole!: string;
  errorMessage: string | null = null;
  selectedTask: any = null;
  taskLogs: any[] = [];
  tasks: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTasks();
  }



  loadTasks(): void {
    this.http.get<any[]>(
      `http://localhost:8080/api/tasks/project/${this.projectId}`,
      { withCredentials: true }
    ).subscribe(
      (tasks) => {
        this.tasks = tasks;
      },
      (error) => {
        console.error('Error loading tasks', error);
      }
    );
  }

  onTaskSelected(task: any): void {
    if (this.selectedTask && this.selectedTask.id === task.id) {
      this.selectedTask = null;
      this.taskLogs = [];
    } else {
      this.selectedTask = task;
      this.loadTaskLogs(task.id);
    }
  }

  loadTaskLogs(taskId: string): void {
    this.http.get<any[]>(
      `http://localhost:8080/api/tasks/${taskId}/logs`,
      { withCredentials: true }
    ).subscribe(
      (logs) => {
        this.taskLogs = logs;
      },
      (error) => {
        console.error('Error loading task logs', error);
      }
    );
  }

  createTask(name: string, description: string, deadline: string): void {
    const task = {
      name: name,
      description: description,
      status: 'PENDING',
      deadline: new Date(deadline).toISOString()
    };

    this.http.post<any>(
      `http://localhost:8080/api/tasks?projectId=${this.projectId}`,
      task,
      { withCredentials: true }
    ).subscribe(
      (response) => {
        alert('Task created successfully!');
        this.errorMessage = null;
      },
      (error) => {
        console.error('Error creating task', error);
        this.errorMessage = 'Failed to create task.';
      }
    );
  }

  canManageRole(targetRole: string): boolean {
    const roleHierarchy: { [key: string]: string[] } = {
      'OWNER': ['ADMIN', 'MANAGER', 'USER'],
      'ADMIN': ['MANAGER', 'USER'],
      'MANAGER': ['USER'],
      'USER': []
    };
    return roleHierarchy[this.currentUserRole]?.includes(targetRole);
  }
}
