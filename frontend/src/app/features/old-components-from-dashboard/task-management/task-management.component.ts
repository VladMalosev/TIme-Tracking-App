import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-task-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './task-management.component.html',
  styleUrl: './task-management.component.css'
})
export class TaskManagementComponent  implements OnInit {
  tasks: any[] = [];
  activeTasks: any[] = [];
  completedTasks: any[] = [];
  assignedTasks: any[] = [];
  userId!: string;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchUserId();
  }

  fetchUserId(): void {
    this.http.get<any>('http://localhost:8080/api/auth/dashboard', { withCredentials: true })
      .subscribe(
        (response) => {
          this.userId = response.userId;
          this.fetchTasks();
        },
        (error) => {
          console.error('Error fetching user ID', error);
        }
      );
  }

  fetchTasks(): void {
    this.http.get<any[]>(`http://localhost:8080/api/tasks/assigned/${this.userId}`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.tasks = response;
          this.filterTasks();
        },
        (error) => {
          console.error('Error fetching tasks', error);
        }
      );
  }

  filterTasks(): void {
    this.activeTasks = this.tasks.filter(task => task.status !== 'COMPLETED');
    this.completedTasks = this.tasks.filter(task => task.status === 'COMPLETED');
    this.assignedTasks = this.tasks.filter(task => task.assignedUserId === this.userId);
  }

  updateTaskStatus(taskId: string, status: string): void {
    this.http.put<any>(
      `http://localhost:8080/api/tasks/${taskId}/status?status=${status}`,
      {},
      { withCredentials: true }
    ).subscribe(
      (response) => {
        alert('Task status updated successfully!');
        this.fetchTasks();
      },
      (error) => {
        console.error('Error updating task status', error);
      }
    );
  }
}
