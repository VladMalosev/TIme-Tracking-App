import {Component, Input, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-task-creation-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './task-creation-component.html',
  styleUrl: './task-creation-component.css'
})
export class TaskCreationComponent implements OnInit {
  @Input() projectId!: string;
  @Input() currentUserRole!: string;
  errorMessage: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  createTask(name: string, description: string): void {
    const task = {
      name: name,
      description: description,
      status: 'PENDING'
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
