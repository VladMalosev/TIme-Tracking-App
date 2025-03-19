import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {TaskDropdownComponent} from './task-dropdown/task-dropdown.component';

@Component({
  selector: 'app-log-time',
  imports: [FormsModule, CommonModule, TaskDropdownComponent],
  templateUrl: './log-time.component.html',
  styleUrls: ['./log-time.component.css']
})
export class LogTimeComponent implements OnInit {
  @Input() userId!: string;
  tasks: any[] = [];
  selectedTaskId: string | null = null;
  isRunning: boolean = false;
  startTime: Date | null = null;
  elapsedTime: number = 0;
  timerInterval: any;
  description: string = '';
  manualStartTime: string = '';
  manualEndTime: string = '';
  manualDescription: string = '';
  errorMessage: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.userId) {
      this.fetchTasks();
    } else {
      console.error('User ID is not available.');
    }
  }


  fetchTasks(): void {
    this.http.get<any[]>(`http://localhost:8080/api/tasks/assigned/${this.userId}`, { withCredentials: true })
      .subscribe(
        (response) => {
          console.log('Tasks fetched:', response);
          this.tasks = response;
          console.log('Tasks array:', this.tasks);
        },
        (error) => {
          console.error('Error fetching tasks', error);
        }
      );
  }


  onTaskSelected(task: any): void {
    console.log('Selected task:', task);
    this.selectedTaskId = task ? task.id : null;
  }


  startTimer(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.startTime = new Date();
      this.timerInterval = setInterval(() => {
        this.elapsedTime = Math.floor((new Date().getTime() - this.startTime!.getTime()) / 1000);
      }, 1000);

      const requestBody = {
        userId: this.userId,
        taskId: this.selectedTaskId || null,
        description: this.description || '',
      };

      this.http.post<any>(`http://localhost:8080/api/timelogs/start`, requestBody, { withCredentials: true })
        .subscribe(
          (response) => {
            console.log('Timer started:', response);
          },
          (error) => {
            console.error('Error starting timer:', error);
            this.errorMessage = 'Failed to start timer.';
          }
        );
    }
  }

  stopTimer(): void {
    if (this.isRunning) {
      this.isRunning = false;
      clearInterval(this.timerInterval);

      const requestBody = {
        userId: this.userId,
        taskId: this.selectedTaskId || null,
      };

      this.http.post<any>(`http://localhost:8080/api/timelogs/stop`, requestBody, { withCredentials: true })
        .subscribe(
          (response) => {
            console.log('Timer stopped:', response);
            this.elapsedTime = 0;
            this.description = '';
          },
          (error) => {
            console.error('Error stopping timer:', error);
            this.errorMessage = 'Failed to stop timer.';
          }
        );
    }
  }

  createManualTimeLog(): void {
    const startTime = new Date(this.manualStartTime).toISOString().replace('Z', '');
    const endTime = new Date(this.manualEndTime).toISOString().replace('Z', '');

    if (startTime >= endTime) {
      this.errorMessage = 'End time must be after start time.';
      return;
    }

    const requestBody = {
      userId: this.userId,
      taskId: this.selectedTaskId || null,
      startTime: startTime,
      endTime: endTime,
      description: this.manualDescription || '',
    };

    this.http.post<any>(`http://localhost:8080/api/timelogs/manual`, requestBody, { withCredentials: true })
      .subscribe(
        (response) => {
          console.log('Manual time log created:', response);
          this.manualStartTime = '';
          this.manualEndTime = '';
          this.manualDescription = '';
          this.errorMessage = null;
        },
        (error) => {
          console.error('Error creating manual time log:', error);
          this.errorMessage = 'Failed to create manual time log.';
        }
      );
  }

  completeTask(): void {
    if (this.selectedTaskId) {
      this.http.put<any>(
        `http://localhost:8080/api/tasks/${this.selectedTaskId}/status?status=COMPLETED`,
        {},
        { withCredentials: true }
      ).subscribe(
        (response) => {
          alert('Task marked as completed!');
          this.stopTimer();
        },
        (error) => {
          console.error('Error completing task:', error);
          if (error.error === 'No active timer found') {
            alert('No active timer found. Task marked as completed without stopping a timer.');
          } else {
            this.errorMessage = 'Failed to complete task.';
          }
        }
      );
    } else {
      this.errorMessage = 'No task selected.';
    }
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
