import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AuthService} from '../../../core/auth/auth.service';
import {TaskService} from '../../../services/main-dashboard/task.service';
import { Task } from '../../../models/main-dashboard';

@Component({
  selector: 'app-upcoming-deadlines',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upcoming-deadlines.component.html',
  styleUrls: ['./upcoming-deadlines.component.css']
})
export class UpcomingDeadlinesComponent implements OnInit {
  upcomingTasks: Task[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private taskService: TaskService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.fetchUpcomingTasks();
  }

  fetchUpcomingTasks(): void {
    this.isLoading = true;
    this.error = null;

    this.authService.userId$.subscribe(userId => {
      if (userId) {
        this.taskService.getTasksWithDeadlines(userId).subscribe({
          next: (tasks) => {
            this.upcomingTasks = tasks;
            this.isLoading = false;
          },
          error: (err) => {
            this.error = 'Failed to fetch upcoming tasks';
            this.isLoading = false;
            console.error('Error fetching tasks:', err);
          }
        });
      } else {
        this.isLoading = false;
        this.error = 'User not authenticated';
      }
    });
  }
}
