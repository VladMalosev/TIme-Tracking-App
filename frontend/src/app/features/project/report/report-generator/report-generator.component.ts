import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {ReportService} from '../../../../services/report/report.service';
import {ReportStateService} from '../../../../services/report/report-state.service';
import {ProjectContextService} from '../../../../services/project-context.service';

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-generator.component.html',
  styleUrls: ['./report-generator.component.scss']
})
export class ReportGeneratorComponent implements OnInit, OnDestroy {
  filter: any = {
    project: null,
    task: null,
    user: null,
    startDate: '',
    endDate: '',
    groupBy: 'none'
  };

  tasks: any[] = [];
  users: any[] = [];
  isLoading = false;

  filteredTasks: any[] = [];
  filteredUsers: any[] = [];
  taskSearchQuery: string = '';
  userSearchQuery: string = '';
  showTaskDropdown = false;
  showUserDropdown = false;

  private projectSubscription?: Subscription;

  constructor(
    private reportService: ReportService,
    private reportState: ReportStateService,
    private projectContext: ProjectContextService
  ) {}

  ngOnInit(): void {
    this.projectSubscription = this.projectContext.currentProjectId$.subscribe(projectId => {
      if (projectId) {
        this.fetchProjectDetails(projectId);
      } else {
        this.filter.project = null;
        this.tasks = [];
        this.users = [];
        this.filteredTasks = [];
        this.filteredUsers = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.projectSubscription?.unsubscribe();
  }

  private fetchProjectDetails(projectId: string): void {
    this.reportService.getProjectDetails(projectId).subscribe({
      next: (project) => {
        this.filter.project = project;
        this.fetchTasks(projectId);
        this.fetchUsers(projectId);
      },
      error: (error) => {
        console.error('Error fetching project details:', error);
      }
    });
  }


  setProject(project: any): void {
    this.filter.project = project;
    if (project) {
      this.fetchTasks(project.id);
      this.fetchUsers(project.id);
    } else {
      this.tasks = [];
      this.users = [];
      this.filteredTasks = [];
      this.filteredUsers = [];
    }
  }

  private fetchTasks(projectId: string): void {
    this.reportService.getTasksForProject(projectId).subscribe({
      next: (response) => {
        this.tasks = Array.isArray(response) ? response : response.tasks || [];
        this.filteredTasks = [...this.tasks];
      },
      error: (error) => {
        console.error('Error fetching tasks:', error);
      }
    });
  }

  private fetchUsers(projectId: string): void {
    this.reportService.getUsersForProject(projectId).subscribe({
      next: (response) => {
        this.users = response;
        this.filteredUsers = [...this.users];
      },
      error: (error) => {
        console.error('Error fetching users:', error);
      }
    });
  }

  filterTasks(): void {
    if (!this.taskSearchQuery) {
      this.filteredTasks = [...this.tasks];
    } else {
      const query = this.taskSearchQuery.toLowerCase();
      this.filteredTasks = this.tasks.filter(task =>
        task.name.toLowerCase().includes(query)
      );

      if (this.filter.task &&
        this.filter.task.name.toLowerCase().includes(query) &&
        !this.filteredTasks.some(t => t.id === this.filter.task.id)) {
        this.filteredTasks.unshift(this.filter.task);
      }
    }
  }

  selectTask(task: any): void {
    this.filter.task = task;
    this.taskSearchQuery = task.name;
    this.showTaskDropdown = false;
    this.filteredTasks = [];
  }

  onBlurTask(): void {
    setTimeout(() => {
      this.showTaskDropdown = false;

      if (this.filter.task && this.taskSearchQuery !== this.filter.task.name) {
        const found = this.tasks.find(t => t.name === this.taskSearchQuery);
        if (!found) {
          this.filter.task = null;
          this.taskSearchQuery = '';
        } else {
          this.selectTask(found);
        }
      }
    }, 200);
  }


  filterUsers(): void {
    if (!this.userSearchQuery) {
      this.filteredUsers = [...this.users];
    } else {
      const query = this.userSearchQuery.toLowerCase();
      this.filteredUsers = this.users.filter(user =>
        user.name.toLowerCase().includes(query)
      );

      if (this.filter.user &&
        this.filter.user.name.toLowerCase().includes(query) &&
        !this.filteredUsers.some(u => u.id === this.filter.user.id)) {
        this.filteredUsers.unshift(this.filter.user);
      }
    }
  }

  selectUser(user: any): void {
    this.filter.user = user;
    this.userSearchQuery = user.name;
    this.showUserDropdown = false;
    this.filteredUsers = [];
  }

  onBlurUser(): void {
    setTimeout(() => {
      this.showUserDropdown = false;

      if (this.filter.user && this.userSearchQuery !== this.filter.user.name) {
        const found = this.users.find(u => u.name === this.userSearchQuery);
        if (!found) {
          this.filter.user = null;
          this.userSearchQuery = '';
        } else {
          this.selectUser(found);
        }
      }
    }, 200);
  }

  generateReport(): void {
    this.reportState.setIsLoading(true);
    this.isLoading = true;

    const startTime = this.filter.startDate ? `${this.filter.startDate}T00:00:00` : null;
    const endTime = this.filter.endDate ? `${this.filter.endDate}T23:59:59` : null;

    let reportObservable;

    if (this.filter.task) {
      reportObservable = this.reportService.generateTaskReport(this.filter.task.id, startTime, endTime);
    } else if (this.filter.user && this.filter.project) {
      reportObservable = this.reportService.generateUserReport(this.filter.user.id, this.filter.project.id, startTime, endTime);
    } else if (this.filter.project) {
      reportObservable = this.reportService.generateProjectReport(this.filter.project.id, startTime, endTime);
    } else {
      reportObservable = this.reportService.generateUserTimeLogsReport(startTime, endTime);
    }

    reportObservable.subscribe({
      next: (response) => {
        this.isLoading = false;
        this.reportState.setReportData(response);
        this.reportState.setIsLoading(false);
        this.reportState.setFilter({...this.filter});
      },
      error: (error) => {
        console.error('Error generating report:', error);
        this.reportState.setIsLoading(false);
        this.isLoading = false;
      }
    });
  }

  clearFilters(): void {
    this.filter = {
      project: this.filter.project,
      task: null,
      user: null,
      startDate: '',
      endDate: '',
      groupBy: 'none'
    };
    this.taskSearchQuery = '';
    this.userSearchQuery = '';
  }

  onGroupByChange(): void {
    // This can be handled by the parent component
  }
}
