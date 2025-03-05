import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  userName!: string;
  userEmail!: string;
  userId!: string;

  isRunning: boolean = false;
  startTime: Date | null = null;
  elapsedTime: number = 0;
  timerInterval: any;
  description: string = '';
  manualStartTime: string = '';
  manualEndTime: string = '';
  manualDescription: string = '';
  timeLogs: any[] = [];
  errorMessage: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Fetch user details
    this.http.get<any>('http://localhost:8080/api/auth/dashboard', { withCredentials: true }).subscribe(
      (response) => {
        this.userName = response.name;
        this.userEmail = response.email;
        this.userId = response.userId;

        this.fetchTimeLogs();
      },
      (error) => {
        console.error('Error fetching dashboard data', error);
      }
    );
  }

  fetchTimeLogs(): void {
    this.http
      .get<any[]>(`http://localhost:8080/api/timelogs/user/${this.userId}`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.timeLogs = response;
        },
        (error) => {
          console.error('Error fetching time logs:', error);
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

      this.http
        .post<any>(`http://localhost:8080/api/timelogs/start`, {
          userId: this.userId,
          description: this.description || '',
        }, { withCredentials: true })
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

      this.http
        .post<any>(`http://localhost:8080/api/timelogs/stop`, {
          userId: this.userId,
        }, { withCredentials: true })
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

    this.http
      .post<any>(
        `http://localhost:8080/api/timelogs/manual`,
        {
          userId: this.userId,
          startTime: startTime,
          endTime: endTime,
          description: this.manualDescription,
        },
        { withCredentials: true }
      )
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

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
