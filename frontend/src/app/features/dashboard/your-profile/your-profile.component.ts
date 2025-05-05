import { Component, OnInit } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {NgForOf, NgIf, DatePipe, NgClass, SlicePipe} from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { finalize, forkJoin } from 'rxjs';
import { PhotoUploadService } from '../../../services/user-profile/photo-upload.service';
import { UserService } from '../../../services/user.service';
import { environment } from '../../../../environments/environment';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TimeLogService } from '../../../services/my-tasks/time-log.service';
import {Router} from '@angular/router';

interface TimeLog {
  formattedTimeRange: string;
  id: string;
  startTime: string;
  endTime: string | null;
  minutes: number;
  description: string;
  task?: any;
  project?: any;
}

interface UserActivity {
  id: string;
  project: string;
  task: {
    id: string;
    name: string;
  };
  timeRange: string;
  startTime: string;
  endTime: string | null;
  status: string;
  description: string;
}

interface UserData {
  id: string;
  name: string;
  profileImage: string;
  photoUrl: string;
  activities: UserActivity[];
}

@Component({
  selector: 'app-your-profile',
  templateUrl: './your-profile.component.html',
  imports: [
    MatIconButton,
    MatIcon,
    NgForOf,
    MatProgressSpinner,
    NgIf,
    SlicePipe,
  ],
  styleUrls: ['./your-profile.component.css']
})
export class YourProfileComponent implements OnInit {
  userData: UserData = {
    id: '',
    name: '',
    profileImage: "/api/placeholder/100/100",
    photoUrl: '',
    activities: []
  };

  isLoading = false;
  isLoadingLogs = false;
  selectedFile: File | null = null;
  avatarUrl = 'assets/icons/avatar.png';
  timeLogs: TimeLog[] = [];
  showAllActivities = false;

  constructor(
    private photoUploadService: PhotoUploadService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private userService: UserService,
    private timeLogService: TimeLogService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.userService.userId$.subscribe(userId => {
      if (userId) {
        this.userData.id = userId;
        this.loadUserData(userId);
        this.loadRecentTimeLogs(userId);
        this.fetchUserTimeLogs(userId);
      }
    });
  }

  loadUserData(userId: string): void {
    this.http.get<any>(`${environment.apiBaseUrl}/users/${userId}`, { withCredentials: true })
      .subscribe({
        next: (userData) => {
          this.userData.name = userData.name;
          this.userData.photoUrl = userData.photoUrl;
          this.updateAvatarUrl();
        },
        error: (err) => {
          console.error('Failed to load user data:', err);
        }
      });
  }

  loadRecentTimeLogs(userId: string): void {
    this.isLoadingLogs = true;

    this.timeLogService.getRecentTasks(userId, 4)
      .pipe(finalize(() => this.isLoadingLogs = false))
      .subscribe({
        next: (recentTasks) => {
          this.userData.activities = recentTasks.map(taskInfo => {
            const lastLog = taskInfo.lastTimeLog;

            let timeRange = 'N/A';
            let startTime = '';
            let endTime = null;

            if (lastLog) {
              startTime = lastLog.startTime;
              endTime = lastLog.endTime;
              timeRange = this.formatTimeRange(lastLog.startTime, lastLog.endTime);
            }

            return {
              id: taskInfo.task.id,
              project: taskInfo.task.project?.name || 'No project',
              task: {
                id: taskInfo.task.id,
                name: taskInfo.task.name || 'Untitled Task'
              },
              startTime: startTime,
              endTime: endTime,
              timeRange: timeRange,
              status: taskInfo.task.status || 'In Progress',
              description: lastLog?.description || ''
            };
          });
        },
        error: (err) => {
          console.error('Failed to load recent time logs:', err);
          this.snackBar.open('Failed to load recent activities', 'Close', { duration: 3000 });
        }
      });
  }

  fetchUserTimeLogs(userId: string): void {
    this.http.get<TimeLog[]>(`${environment.apiBaseUrl}/timelogs/user/${userId}`, { withCredentials: true })
      .subscribe({
        next: (timeLogs) => {
          this.timeLogs = timeLogs.map(log => ({
            ...log,
            formattedStartTime: this.formatTime(log.startTime),
            formattedEndTime: this.formatTime(log.endTime),
            formattedTimeRange: this.formatTimeRange(log.startTime, log.endTime)
          }));
        },
        error: (err) => {
          console.error('Failed to load time logs:', err);
          this.snackBar.open('Failed to load time logs', 'Close', { duration: 3000 });
        }
      });
  }

  formatTimeRange(startTime: string, endTime: string | null): string {
    if (!startTime) return 'N/A';

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    if (end) {
      if (start.toDateString() === end.toDateString()) {
        return `${formatDate(start)} ${formatTime(start)} - ${formatTime(end)}`;
      } else {
        return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
      }
    } else {
      return `${formatDate(start)} ${formatTime(start)} - now`;
    }
  }

  updateAvatarUrl(): void {
    if (this.userData.photoUrl) {
      this.avatarUrl = this.getPhotoUrl(this.userData.photoUrl);
    } else {
      this.avatarUrl = 'assets/icons/avatar.png';
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }

  getPhotoUrl(url: string | undefined): string {
    if (!url || url === '') {
      return 'assets/icons/avatar.png';
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const cleanPath = url.startsWith('/') ? url.substring(1) : url;

    return `${environment.apiBaseUrl.replace(/\/api$/, '')}/${cleanPath}`;
  }

  formatDuration(startTime: string, endTime: string | null): string {
    if (!startTime) return '0m';

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();

    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  }

  goToTask(log: TimeLog): void {
    if (!log.task?.id || !log.project?.id) {
      this.snackBar.open('Task or project information is missing', 'Close', { duration: 3000 });
      return;
    }

    this.router.navigate([
      '/project-details',
      log.project.id,
      'dashboard'
    ], {
      queryParams: {
        tab: 'tasks',
        subTab: 'assigned-tasks',
        taskTab: 'my-tasks',
        taskId: log.task.id
      }
    });
  }


  viewAllActivities(): void {
    // Navigate to all activities page
    // Implement navigation logic here
  }

  formatTime(dateString: string | null | undefined): string {
    if (!dateString) return 'Not recorded';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid time';

      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid time';
    }
  }

  toggleViewAllActivities() {
    this.showAllActivities = !this.showAllActivities;
  }
}
