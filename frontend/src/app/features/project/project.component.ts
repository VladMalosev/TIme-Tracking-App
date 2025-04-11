import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {CommonModule, DatePipe} from '@angular/common';
import { ProjectMembersComponent } from './project-members/project-members.component';
import { ProjectTasksComponent } from './tasks/project-tasks/project-tasks.component';
import { FormsModule } from '@angular/forms';
import {TaskAssignmentComponent} from "./tasks/task-assignment/task-assignment.component";
import {TaskSubtabsComponent} from './tasks/my-tasks/task-subtabs/task-subtabs.component';
import {TaskTabsService} from '../../services/task-tabs-service';
import {ProjectTasksService} from '../../services/project-tasks/project-tasks.service';
import {InvitationsService} from '../../services/project-tasks/invitations.service';
import {TaskAssignmentService} from '../../services/project-tasks/task-assignment.service';
import {MyTasksComponent} from './tasks/my-tasks/my-tasks.component';
import {ProjectContextService} from '../../services/project-context.service';
import {ProjectDashboardComponent} from './project-dashboard/project-dashboard.component';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatOptionModule} from '@angular/material/core';
import {MatTabsModule} from '@angular/material/tabs';
import {MatIconModule} from '@angular/material/icon';
import {ReportComponent} from './report/report.component';

@Component({
    selector: 'app-project',
    templateUrl: './project.component.html',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatTabsModule,
    MatIconModule,
    ProjectDashboardComponent,
    ProjectMembersComponent,
    TaskSubtabsComponent,
    ProjectTasksComponent,
    TaskAssignmentComponent,
    MyTasksComponent,
    ReportComponent,
  ],
  styleUrls: ['./project.component.css']
})

export class ProjectComponent implements OnInit {
    projectId: string | null = null;
    project: any = null;
    activeTab: string = 'dashboard';
    projectStats: any = null;
    recentActivities: string[] = [];
    upcomingDeadlines: any[] = [];
    currentUserRole: string = 'USER';
    collaborators: any[] = [];
    tasks: any[] = [];
    userId!: string;
    activeTaskTab: string = 'my-tasks';

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient,
        private router: Router,
        private taskTabsService: TaskTabsService,
        private projectTasksService: ProjectTasksService,
        private invitationsService: InvitationsService,
        private taskAssignmentService: TaskAssignmentService,
        private projectContextService: ProjectContextService
    ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    this.route.queryParams.subscribe(params => {
      this.activeTab = params['tab'] || 'dashboard';

      if (this.activeTab === 'tasks' && !params['taskTab']) {
        this.activeTaskTab = 'my-tasks';
        this.updateTaskTabQueryParam('my-tasks');
      } else if (this.activeTab === 'members' && !params['taskTab']) {
        this.activeTaskTab = 'members';
        this.updateTaskTabQueryParam('members');
      } else {
        this.activeTaskTab = params['taskTab'] || 'my-tasks';
      }

      this.taskTabsService.setActiveTab(this.activeTaskTab);
      this.taskTabsService.setCanAssignTasks(this.canAssignTasks());
    });

    if (this.projectId) {
      this.projectContextService.setCurrentProjectId(this.projectId);
      this.projectTasksService.setProjectId(this.projectId);
      this.invitationsService.setProjectId(this.projectId);
      this.projectTasksService.setCurrentUserRole(this.currentUserRole);
      this.taskAssignmentService.setProjectId(this.projectId);
      this.fetchProjectDetails(this.projectId);
      this.fetchDashboardData(this.projectId);
      this.fetchCurrentUserRole(this.projectId);
      this.fetchCollaborators(this.projectId);
      this.fetchTasks(this.projectId);
      this.fetchUserId();
    } else {
      console.error('Project ID is missing');
    }
  }

  private updateTaskTabQueryParam(tab: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { taskTab: tab },
      queryParamsHandling: 'merge'
    });
  }


    fetchProjectDetails(projectId: string): void {
        this.http.get<any>(`http://localhost:8080/api/projects/${projectId}`, { withCredentials: true })
            .subscribe(
                (response) => {
                    this.project = response;
                },
                (error) => {
                    console.error('Error fetching project details', error);
                }
            );
    }

    fetchDashboardData(projectId: string): void {
        this.http.get<any>(`http://localhost:8080/api/projects/${projectId}/stats`, { withCredentials: true })
            .subscribe(
                (response) => {
                    this.projectStats = response;
                },
                (error) => {
                    console.error('Error fetching project stats', error);
                }
            );

        this.http.get<string[]>(`http://localhost:8080/api/projects/${projectId}/activities`, { withCredentials: true })
            .subscribe(
                (response) => {
                    this.recentActivities = response;
                },
                (error) => {
                    console.error('Error fetching recent activities', error);
                }
            );

        this.http.get<any[]>(`http://localhost:8080/api/projects/${projectId}/deadlines`, { withCredentials: true })
            .subscribe(
                (response) => {
                    this.upcomingDeadlines = response;
                },
                (error) => {
                    console.error('Error fetching upcoming deadlines', error);
                }
            );
    }

  fetchCurrentUserRole(projectId: string): void {
    this.http.get<any>(`http://localhost:8080/api/projects/${projectId}/current-user-role`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.currentUserRole = response.role;
          this.taskAssignmentService.setCurrentUserRole(response.role);
          this.projectTasksService.setCurrentUserRole(response.role);
          this.invitationsService.setCurrentUserRole(response.role);
          this.taskTabsService.setCanAssignTasks(this.canAssignTasks());
        },
        (error) => {
          console.error('Error fetching current user role', error);
        }
      );
  }

  fetchCollaborators(projectId: string): void {
    this.http.get<any[]>(`http://localhost:8080/api/projects/${projectId}/collaborators`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.collaborators = response;
          this.taskAssignmentService.setCollaborators(response);
        },
        (error) => {
          console.error('Error fetching collaborators', error);
        }
      );
  }

  fetchTasks(projectId: string): void {
    this.http.get<any[]>(`http://localhost:8080/api/tasks/project/${projectId}`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.tasks = response;
          this.taskAssignmentService.setTasks(response);
        },
        (error) => {
          console.error('Error fetching tasks', error);
        }
      );
  }


  fetchUserId(): void {
    this.http.get<any>('http://localhost:8080/api/auth/dashboard', { withCredentials: true })
      .subscribe(
        (response) => {
          this.userId = response.userId;
          this.taskAssignmentService.setUserId(response.userId);
        },
        (error) => {
          console.error('Error fetching user ID', error);
        }
      );
  }


    canAssignTasks(): boolean {
        const allowedRoles = ['ADMIN', 'OWNER', 'MANAGER'];
        return allowedRoles.includes(this.currentUserRole);
    }


  setActiveTab(tab: string): void {
    this.activeTab = tab;

    let queryParams: any = { tab };
    if (tab === 'tasks') {
      queryParams.taskTab = 'my-tasks';
      this.activeTaskTab = 'my-tasks';
    } else if (tab === 'members') {
      queryParams.taskTab = 'members';
      this.activeTaskTab = 'members';
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }


  canAccessInvitations(): boolean {
    return ['ADMIN', 'OWNER', 'MANAGER'].includes(this.currentUserRole);
  }

  canAccessLogs(): boolean {
    return ['ADMIN', 'OWNER'].includes(this.currentUserRole);
  }

}
