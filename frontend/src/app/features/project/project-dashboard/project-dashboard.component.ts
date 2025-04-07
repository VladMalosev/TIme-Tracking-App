import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { ProjectContextService } from '../../../services/project-context.service';
import { TaskAssignmentService } from '../../../services/project-tasks/task-assignment.service';
import { TimeTrackingService } from '../../../services/time-tracking.service';
import {MatCheckbox} from '@angular/material/checkbox';
import {WelcomeCardComponent} from './welcome-card/welcome-card.component';
import {QuickActionsComponent} from './quick-actions/quick-actions.component';
import {TaskListComponent} from './task-list/task-list.component';
import {StatsCardComponent} from './stats-card/stats-card.component';
import {ActivityListComponent} from './activity-list/activity-list.component';
import {TimeTrackingComponent} from './time-tracking/time-tracking.component';

@Component({
  selector: 'app-project-dashboard',
  templateUrl: './project-dashboard.component.html',
  styleUrls: ['./project-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatTabsModule,
    FormsModule,
    WelcomeCardComponent,
    QuickActionsComponent,
    TaskListComponent,
    StatsCardComponent,
    ActivityListComponent,
    TimeTrackingComponent,
  ]
})
export class ProjectDashboardComponent implements OnInit {
  project: any = null;
  projectStats: any = null;
  recentActivities: any[] = [];
  upcomingDeadlines: any[] = [];
  projectId: string | null = null;
  currentUserRole: string = 'USER';

  // Quick time log modal properties
  showQuickTimeLogModal = false;
  assignedTasks: any[] = [];
  selectedTaskId: string | null = null;
  taskLogDuration: number | null = null;
  taskLogDescription: string = '';
  projectLogDuration: number | null = null;
  projectLogDescription: string = '';

  constructor(
    private projectContextService: ProjectContextService,
    private http: HttpClient,
    private taskAssignmentService: TaskAssignmentService,
    private timeTrackingService: TimeTrackingService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.projectId = this.projectContextService.getCurrentProjectId();
    if (this.projectId) {
      this.fetchProjectDetails();
      this.fetchDashboardData();
      this.fetchCurrentUserRole();
      this.loadAssignedTasks();
    }
  }

  fetchProjectDetails(): void {
    this.http.get<any>(`http://localhost:8080/api/projects/${this.projectId}`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.project = response;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching project details', error);
        }
      });
  }

  fetchDashboardData(): void {
    this.http.get<any>(`http://localhost:8080/api/projects/${this.projectId}/stats`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.projectStats = response;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching project stats', error);
        }
      });

    this.http.get<string[]>(`http://localhost:8080/api/projects/${this.projectId}/activities`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.recentActivities = response;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching recent activities', error);
        }
      });

    this.http.get<any[]>(`http://localhost:8080/api/projects/${this.projectId}/deadlines`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.upcomingDeadlines = response;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching upcoming deadlines', error);
        }
      });
  }

  fetchCurrentUserRole(): void {
    this.http.get<any>(`http://localhost:8080/api/projects/${this.projectId}/current-user-role`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.currentUserRole = response.role;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching current user role', error);
        }
      });
  }

  loadAssignedTasks(): void {

  }

  setActiveTab(tab: string): void {
    this.router.navigate([], {
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  canAccessLogs(): boolean {
    return ['ADMIN', 'OWNER'].includes(this.currentUserRole);
  }

  openQuickTimeLogModal(): void {
    this.showQuickTimeLogModal = true;
    this.selectedTaskId = null;
    this.taskLogDuration = null;
    this.taskLogDescription = '';
    this.projectLogDuration = null;
    this.projectLogDescription = '';
  }

  closeQuickTimeLogModal(): void {
    this.showQuickTimeLogModal = false;
  }

  submitTaskTimeLog(): void {
    if (!this.selectedTaskId || !this.taskLogDuration) return;

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (this.taskLogDuration * 60000));

    this.timeTrackingService.createManualTimeLog(
      this.selectedTaskId,
      startTime.toISOString(),
      endTime.toISOString(),
      this.taskLogDescription
    ).subscribe({
      next: () => {
        this.snackBar.open('Time logged successfully!', 'Close', { duration: 3000 });
        this.closeQuickTimeLogModal();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error logging time:', error);
        this.snackBar.open('Failed to log time', 'Close', { duration: 3000 });
      }
    });
  }

  submitProjectTimeLog(): void {
    if (!this.projectLogDuration || !this.projectId) return;

    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (this.projectLogDuration * 60000));

    // Fallback if createProjectTimeLog doesn't exist
    (this.timeTrackingService as any).createProjectTimeLog?.(
      this.projectId,
      startTime.toISOString(),
      endTime.toISOString(),
      this.projectLogDescription
    ).subscribe({
      next: () => {
        this.snackBar.open('Time logged successfully!', 'Close', { duration: 3000 });
        this.closeQuickTimeLogModal();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error logging time:', error);
        this.snackBar.open('Failed to log time', 'Close', { duration: 3000 });
      }
    });
  }

  isProjectLog: boolean = false;
  logDuration: number | null = null;
  logDescription: string = '';

// Add these methods to your component class
  logTimeForTask(task: any): void {
    this.selectedTaskId = task.id;
    this.isProjectLog = false;
    this.showQuickTimeLogModal = true;
    this.logDuration = null;
    this.logDescription = '';
  }

  openProjectLogModal(): void {
    this.selectedTaskId = null;
    this.isProjectLog = true;
    this.showQuickTimeLogModal = true;
    this.logDuration = null;
    this.logDescription = '';
  }

  selectTaskForLogging(task: any): void {
    this.selectedTaskId = task.id;
    this.isProjectLog = false;
    this.logDuration = null;
    this.logDescription = '';
  }

  selectProjectForLogging(): void {
    this.selectedTaskId = null;
    this.isProjectLog = true;
    this.logDuration = null;
    this.logDescription = '';
  }

  submitTimeLog(): void {
    if (this.isProjectLog) {
      this.projectLogDuration = this.logDuration;
      this.projectLogDescription = this.logDescription;
      this.submitProjectTimeLog();
    } else {
      this.taskLogDuration = this.logDuration;
      this.taskLogDescription = this.logDescription;
      this.submitTaskTimeLog();
    }
  }
  navigateToReports(): void {
    this.router.navigate(['/projects', this.projectId, 'reports']);
  }

  showAllTasks(): void {
    this.setActiveTab('tasks');
  }

  showAllActivity(): void {
    this.setActiveTab('activity');
  }

  viewTaskDetails(task: any): void {
    this.router.navigate(['/projects', this.projectId, 'tasks', task.id]);
  }

  isTaskUrgent(task: any): boolean {
    const today = new Date();
    const due = new Date(task.dueDate);
    return task.status !== 'COMPLETED' && due.getTime() - today.getTime() <= 2 * 24 * 60 * 60 * 1000; // within 2 days
  }

  getTaskColor(task: any): string {
    if (task.priority === 'HIGH') return '#ff5252';
    if (task.priority === 'MEDIUM') return '#ffa000';
    if (task.priority === 'LOW') return '#4caf50';
    return '#9e9e9e';
  }

  setDuration(minutes: number): void {
    this.logDuration = minutes;
  }

  taskSearchQuery: string = '';

  get filteredTasks(): any[] {
    if (!this.taskSearchQuery) return this.assignedTasks;
    const query = this.taskSearchQuery.toLowerCase();
    return this.assignedTasks.filter(task =>
      task.name.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query)
    );
  }

  timePresets: number[] = [15, 30, 60]; // You can customize this

  getActivityType(activity: any): string {
    if (!activity || !activity.type) return 'default';
    switch (activity.type) {
      case 'TASK_CREATED': return 'task-created';
      case 'TIME_LOGGED': return 'time-logged';
      case 'TASK_COMPLETED': return 'task-completed';
      default: return 'default';
    }
  }

  getActivityIcon(activity: any): string {
    if (!activity || !activity.type) return 'info';
    switch (activity.type) {
      case 'TASK_CREATED': return 'add_task';
      case 'TIME_LOGGED': return 'access_time';
      case 'TASK_COMPLETED': return 'check_circle';
      default: return 'info';
    }
  }
  getTimeProgress(): number {
    const logged = this.projectStats?.totalHoursLogged || 0;
    const weeklyGoal = 40; // adjust based on your logic
    return Math.min(100, Math.round((logged / weeklyGoal) * 100));
  }

  getRemainingTime(): number {
    const logged = this.projectStats?.totalHoursLogged || 0;
    const weeklyGoal = 40; // adjust if needed
    return Math.max(0, weeklyGoal - logged);
  }

  isDeadlineApproaching(deadline: string | Date): boolean {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Consider urgent if within 7 days
  }
}
