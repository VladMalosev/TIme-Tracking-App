import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownComponent } from './dropdown/dropdown.component';
import { UserDropdownComponent } from './user-dropdown/user-dropdown.component';

@Component({
  selector: 'app-task-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent, UserDropdownComponent],
  templateUrl: './task-assignment.component.html',
  styleUrls: ['./task-assignment.component.css']
})
export class TaskAssignmentComponent implements OnInit {
  @Input() projectId!: string;
  @Input() tasks: any[] = [];
  @Input() collaborators: any[] = [];
  @Input() currentUserRole!: string;
  @Input() userId!: string;
  errorMessage: string | null = null;

  selectedTask: any = null;
  selectedUser: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  onTaskSelected(task: any): void {
    this.selectedTask = task;
  }

  onUserSelected(user: any): void {
    this.selectedUser = user;
  }

  assignTask(): void {
    if (!this.selectedTask || !this.selectedUser) {
      this.errorMessage = 'Please select a task and a user.';
      return;
    }

    this.http.post<any>(
      `http://localhost:8080/api/tasks/${this.selectedTask.id}/assign?userId=${this.selectedUser.user.id}&assignedBy=${this.userId}`,
      {}, { withCredentials: true }
    ).subscribe(
      () => {
        alert('Task assigned successfully!');
        this.errorMessage = null;
        this.selectedTask = null;
        this.selectedUser = null;
      },
      (error) => {
        console.error('Error assigning task', error);
        this.errorMessage = 'Failed to assign task.';
      }
    );
  }

  canAssignTasks(): boolean {
    const allowedRoles = ['ADMIN', 'OWNER', 'MANAGER'];
    return allowedRoles.includes(this.currentUserRole);
  }
}
