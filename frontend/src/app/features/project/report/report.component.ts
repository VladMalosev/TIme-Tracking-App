import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProjectContextService } from '../../../services/project-context.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ReportService } from '../../../services/report/report.service';
import {ReportGeneratorComponent} from './report-generator/report-generator.component';
import {Subscription} from 'rxjs';
import {ReportStateService} from '../../../services/report/report-state.service';
import {ReportResultsComponent} from './report-results/report-results.component';
import {Router} from '@angular/router';

interface ReportFilter {
  project: any | null;
  task: any | null;
  user: any | null;
  startDate: string;
  endDate: string;
  groupBy: 'none' | 'task' | 'user' | 'project';
}

interface TimeLogWithStatus {
  timeLog: {
    id: string;
    startTime: string;
    endTime: string;
    minutes: number;
    description: string;
    task?: { id: string; name: string };
    user?: { id: string; name: string };
    project?: { id: string; name: string };
  };
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
}

interface GroupedReportData {
  groupName: string;
  logs: TimeLogWithStatus[];
  subGroups?: GroupedReportData[];
  totalMinutes: number;
  expanded: boolean;
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ReportGeneratorComponent, ReportResultsComponent],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit, OnDestroy {
  private reportDataSubscription?: Subscription;
  private filterSubscription?: Subscription;


  filter: ReportFilter = {
    project: null,
    task: null,
    user: null,
    startDate: '',
    endDate: '',
    groupBy: 'none'
  };

  projects: any[] = [];
  tasks: any[] = [];
  users: any[] = [];
  reportData: TimeLogWithStatus[] = [];
  groupedReportData: GroupedReportData[] = [];
  isLoading = false;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  filteredTasks: any[] = [];
  filteredUsers: any[] = [];
  taskSearchQuery: string = '';
  userSearchQuery: string = '';
  showTaskDropdown = false;
  showUserDropdown = false;
  canAccess = false;

  constructor(
    private http: HttpClient,
    private projectContext: ProjectContextService,
    private authService: AuthService,
    private reportService: ReportService,
    private reportState: ReportStateService,
    private router: Router,
  ) {}

  async ngOnInit() {
    const projectId = this.projectContext.getCurrentProjectId();
    if (!projectId) {
      this.router.navigate(['/projects']);
      return;
    }

    const userRole = await this.authService.getUserProjectRole(projectId);
    this.canAccess = ['ADMIN', 'OWNER'].includes(userRole);



    // Rest of your initialization
    this.initializeProjectContext();
    this.setupReportStateSubscriptions();
  }

  ngOnDestroy(): void {
    this.reportDataSubscription?.unsubscribe();
    this.filterSubscription?.unsubscribe();
  }

  private setupReportStateSubscriptions(): void {
    this.reportDataSubscription = this.reportState.reportData$.subscribe(data => {
      if (data) {
        this.reportData = data;
        if (this.filter.groupBy !== 'none') {
          this.groupReportData();
        }
      }
    });

    this.filterSubscription = this.reportState.filter$.subscribe(filter => {
      if (filter) {
        this.filter = filter;
      }
    });
  }

  private initializeProjectContext(): void {
    this.projectContext.currentProjectId$.subscribe(projectId => {
      if (projectId) {
        this.fetchProjectDetails(projectId);
        this.fetchTasks(projectId);
        this.fetchUsers(projectId);
      }
    });
  }

  onReportGenerated(event: {data: any, filter: any}): void {
    this.reportData = event.data;
    this.filter = event.filter;

    if (this.filter.groupBy !== 'none') {
      this.groupReportData();
    }
  }

  private fetchProjectDetails(projectId: string): void {
    this.http.get<any>(`http://localhost:8080/api/projects/${projectId}`, { withCredentials: true })
      .subscribe({
        next: (project) => {
          this.filter.project = project;
        },
        error: (error) => {
          console.error('Error fetching project details:', error);
        }
      });
  }

  fetchTasks(projectId: string): void {
    this.http.get<any>(`http://localhost:8080/api/tasks/project/${projectId}`, { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.tasks = Array.isArray(response) ? response : response.tasks || [];
          this.filteredTasks = [...this.tasks];
        },
        error: (error) => {
          console.error('Error fetching tasks:', error);
        }
      });
  }

  fetchUsers(projectId: string): void {
    this.http.get<any>(`http://localhost:8080/api/projects/${projectId}/users`, { withCredentials: true })
      .subscribe({
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
    }
  }

  selectTask(task: any): void {
    this.filter.task = task;
    this.taskSearchQuery = task.name;
    this.showTaskDropdown = false;
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
          this.taskSearchQuery = this.filter.task.name;
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
    }
  }

  selectUser(user: any): void {
    this.filter.user = user;
    this.userSearchQuery = user.name;
    this.showUserDropdown = false;
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
          this.userSearchQuery = this.filter.user.name;
        }
      }
    }, 200);
  }

  onGroupByChange(): void {
    if (this.reportData.length > 0) {
      if (this.filter.groupBy !== 'none') {
        this.groupReportData();
      } else {
        this.groupedReportData = [];
      }
    }
  }

  generateReport(): void {
    this.isLoading = true;
    this.reportData = [];
    this.groupedReportData = [];

    const startTime = this.filter.startDate ? `${this.filter.startDate}T00:00:00` : null;
    const endTime = this.filter.endDate ? `${this.filter.endDate}T23:59:59` : null;

    if (this.filter.task) {
      this.reportService.generateTaskReport(this.filter.task.id, startTime, endTime)
        .subscribe({
          next: (response) => this.handleReportResponse(response),
          error: (error) => this.handleReportError(error)
        });
    } else if (this.filter.user && this.filter.project) {
      this.reportService.generateUserReport(this.filter.user.id, this.filter.project.id, startTime, endTime)
        .subscribe({
          next: (response) => this.handleReportResponse(response),
          error: (error) => this.handleReportError(error)
        });
    } else if (this.filter.project) {
      this.reportService.generateProjectReport(this.filter.project.id, startTime, endTime)
        .subscribe({
          next: (response) => this.handleReportResponse(response),
          error: (error) => this.handleReportError(error)
        });
    } else {
      this.reportService.generateUserTimeLogsReport(startTime, endTime)
        .subscribe({
          next: (response) => this.handleReportResponse(response),
          error: (error) => this.handleReportError(error)
        });
    }
  }

  private handleReportResponse(response: TimeLogWithStatus[]): void {
    this.reportData = response;
    if (this.filter.groupBy !== 'none') {
      this.groupReportData();
    }
    this.isLoading = false;
  }

  private handleReportError(error: any): void {
    console.error('Error generating report:', error);
    this.isLoading = false;
  }

  groupReportData(): void {
    const groupMap = new Map<string, GroupedReportData>();

    // First level grouping (by the selected groupBy)
    this.reportData.forEach(log => {
      let groupName = '';
      switch (this.filter.groupBy) {
        case 'task': groupName = log.timeLog.task?.name || 'No Task'; break;
        case 'user': groupName = log.timeLog.user?.name || 'No User'; break;
        case 'project': groupName = log.timeLog.project?.name || 'No Project'; break;
      }

      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, {
          groupName,
          logs: [],
          totalMinutes: 0,
          expanded: true
        });
      }

      const group = groupMap.get(groupName)!;
      group.logs.push(log);
      group.totalMinutes += log.timeLog.minutes || 0;
    });

    // If grouping by user, add second level grouping by task
    if (this.filter.groupBy === 'user') {
      groupMap.forEach((group) => {
        const taskMap = new Map<string, GroupedReportData>();

        group.logs.forEach(log => {
          const taskName = log.timeLog.task?.name || 'No Task';

          if (!taskMap.has(taskName)) {
            taskMap.set(taskName, {
              groupName: taskName,
              logs: [],
              totalMinutes: 0,
              expanded: true
            });
          }

          const taskGroup = taskMap.get(taskName)!;
          taskGroup.logs.push(log);
          taskGroup.totalMinutes += log.timeLog.minutes || 0;
        });

        // Convert the taskMap to an array and assign to subGroups
        group.subGroups = Array.from(taskMap.values());

        // Sort subgroups by task name
        group.subGroups.sort((a, b) => a.groupName.localeCompare(b.groupName));
      });
    }

    this.groupedReportData = Array.from(groupMap.values());
    this.sortGroupedData();
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    if (this.filter.groupBy !== 'none') {
      this.sortGroupedData();
    } else {
      this.sortReportData();
    }
  }

  private sortReportData(): void {
    this.reportData.sort((a, b) => {
      const valueA = this.getPropertyValue(a, this.sortColumn);
      const valueB = this.getPropertyValue(b, this.sortColumn);

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private sortGroupedData(): void {
    this.groupedReportData.sort((a, b) => {
      if (this.sortColumn.includes(this.filter.groupBy)) {
        if (a.groupName < b.groupName) return this.sortDirection === 'asc' ? -1 : 1;
        if (a.groupName > b.groupName) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      } else {
        if (a.totalMinutes < b.totalMinutes) return this.sortDirection === 'asc' ? -1 : 1;
        if (a.totalMinutes > b.totalMinutes) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      }
    });

    this.groupedReportData.forEach(group => {
      group.logs.sort((a, b) => {
        const valueA = this.getPropertyValue(a, this.sortColumn);
        const valueB = this.getPropertyValue(b, this.sortColumn);

        if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    });
  }

  private getPropertyValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  toggleGroupExpansion(group: GroupedReportData): void {
    group.expanded = !group.expanded;
  }

  exportToPDF(): void {
    if (!this.filter.project) return;

    const startTime = this.filter.startDate ? `${this.filter.startDate}T00:00:00` : null;
    const endTime = this.filter.endDate ? `${this.filter.endDate}T23:59:59` : null;

    if (this.filter.task) {
      this.reportService.downloadTaskPdf(
        this.filter.task.id,
        startTime,
        endTime,
        this.filter.task.name
      ).subscribe(this.handlePdfDownload('task_report.pdf'));
    } else if (this.filter.user) {
      this.reportService.downloadUserPdf(
        this.filter.user.id,
        this.filter.project.id,
        startTime,
        endTime,
        this.filter.user.name
      ).subscribe(this.handlePdfDownload('user_report.pdf'));
    } else {
      this.reportService.downloadProjectPdf(
        this.filter.project.id,
        startTime,
        endTime,
        this.filter.project.name
      ).subscribe(this.handlePdfDownload('project_report.pdf'));
    }
  }

  private handlePdfDownload(defaultFilename: string): (blob: Blob) => void {
    return (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      a.click();
      window.URL.revokeObjectURL(url);
    };
  }

  exportToCSV(): void {
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add headers
    const headers = [
      'Start Time', 'End Time', 'Duration (min)',
      'Description', 'User', 'Task', 'Status'
    ];
    csvContent += headers.join(",") + "\r\n";

    // Add data rows
    const dataToExport = this.filter.groupBy !== 'none'
      ? this.groupedReportData.flatMap(g => g.logs)
      : this.reportData;

    dataToExport.forEach(log => {
      const row = [
        log.timeLog.startTime,
        log.timeLog.endTime,
        log.timeLog.minutes,
        `"${log.timeLog.description.replace(/"/g, '""')}"`,
        log.timeLog.user?.name || 'N/A',
        log.timeLog.task?.name || 'N/A',
        log.status
      ];
      csvContent += row.join(",") + "\r\n";
    });

    // Trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "report_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  clearFilters(): void {
    this.filter = {
      project: this.projectContext.getCurrentProjectId() ? this.filter.project : null,
      task: null,
      user: null,
      startDate: '',
      endDate: '',
      groupBy: 'none'
    };
    this.taskSearchQuery = '';
    this.userSearchQuery = '';
    this.reportData = [];
    this.groupedReportData = [];
  }

  getTotalMinutes(): number {
    return this.reportData.reduce((sum, item) => sum + (item.timeLog.minutes || 0), 0);
  }

  // Add these new methods to your component class
  getGroupLabel(): string {
    switch (this.filter.groupBy) {
      case 'task': return 'Task';
      case 'user': return 'User';
      case 'project': return 'Project';
      default: return 'Group';
    }
  }

  hasUsers(group: GroupedReportData): boolean {
    return group.logs.some(log => log.timeLog.user);
  }

  hasTasks(group: GroupedReportData): boolean {
    return group.logs.some(log => log.timeLog.task);
  }

  getUniqueUsers(group: GroupedReportData): string {
    const users = new Set<string>();
    group.logs.forEach(log => {
      if (log.timeLog.user?.name) {
        users.add(log.timeLog.user.name);
      }
    });
    return Array.from(users).join(', ');
  }

  getUniqueTasks(group: GroupedReportData): string {
    const tasks = new Set<string>();
    group.logs.forEach(log => {
      if (log.timeLog.task?.name) {
        tasks.add(log.timeLog.task.name);
      }
    });
    return Array.from(tasks).join(', ');
  }

  getStatusCount(group: GroupedReportData, status: string): number {
    return group.logs.filter(log => log.status === status).length;
  }

  getDominantStatus(group: any): string {
    const completed = this.getStatusCount(group, 'COMPLETED');
    const inProgress = this.getStatusCount(group, 'IN_PROGRESS');
    const pending = this.getStatusCount(group, 'PENDING');

    const max = Math.max(completed, inProgress, pending);

    if (max === completed) return 'Completed';
    if (max === inProgress) return 'In Progress';
    if (max === pending) return 'Pending';

    return 'N/A';
  }

  getStatusClass(group: any): string {
    const status = this.getDominantStatus(group);
    switch (status) {
      case 'Completed':
        return 'status-completed';
      case 'In Progress':
        return 'status-in-progress';
      case 'Pending':
        return 'status-pending';
      default:
        return '';
    }
  }


}
