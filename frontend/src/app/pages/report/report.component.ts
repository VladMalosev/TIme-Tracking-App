import { Component, OnInit } from '@angular/core';
import { ReportService } from '../../services/report.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {DropdownComponent} from '../dropdown/dropdown.component';

interface Log {
  timeLog: {
    startTime: string;
    endTime: string;
    minutes: number;
    description: string;
    task?: { name: string };
    user?: { name: string };
  };
  status: string;
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownComponent],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  selectedProject: any = null;
  selectedTask: any = null;
  selectedUser: any = null;
  startTime: string = '';
  endTime: string = '';
  reportData: any[] = [];
  sortedReportData: any[] = [];
  groupedReportData: any[] = [];
  sortColumn: string = '';
  sortDirection: string = 'asc';
  groupByTask: boolean = false;

  projects: any[] = [];
  tasks: any[] = [];
  users: any[] = [];


  constructor(private reportService: ReportService, private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchProjects();
  }

  fetchProjects(): void {
    this.http.get<any>('http://localhost:8080/api/projects', { withCredentials: true }).subscribe({
      next: (response) => {
        console.log('Projects response:', response);
        this.projects = [...response.ownedProjects, ...response.collaboratedProjects];
      },
      error: (error) => {
        console.error('Error fetching projects:', error);
      }
    });
  }

  fetchTasks(projectId: string): void {
    this.http.get<any>(`http://localhost:8080/api/tasks/project/${projectId}`, { withCredentials: true }).subscribe({
      next: (response) => {
        console.log('Tasks response:', response);
        this.tasks = Array.isArray(response) ? response : response.tasks || [];
      },
      error: (error) => {
        console.error('Error fetching tasks:', error);
      }
    });
  }

  fetchUsers(projectId: string): void {
    this.http.get<any>(`http://localhost:8080/api/projects/${projectId}/users`, { withCredentials: true }).subscribe({
      next: (response) => {
        console.log('Users response:', response);
        this.users = response;
      },
      error: (error) => {
        console.error('Error fetching users:', error);
      }
    });
  }

  onProjectSelected(project: any): void {
    this.selectedProject = project;
    if (project) {
      this.fetchTasks(project.id);
      this.fetchUsers(project.id);
    } else {
      this.tasks = [];
      this.users = [];
    }
  }


  onTaskSelected(task: any): void {
    this.selectedTask = task;
  }

  onUserSelected(user: any): void {
    this.selectedUser = user;
  }

  generateReport(): void {
    const startTimeWithSeconds = this.startTime ? this.startTime + ':00' : null;
    const endTimeWithSeconds = this.endTime ? this.endTime + ':00' : null;

    if (this.selectedTask) {
      this.reportService.generateTaskReport(this.selectedTask.id, startTimeWithSeconds, endTimeWithSeconds).subscribe({
        next: (response: any[]) => {
          console.log('Task report response:', response);
          this.reportData = response;
          this.sortedReportData = [...this.reportData];
          this.groupedReportData = this.groupByTask ? this.groupLogsByTask(this.reportData) : [];
        },
        error: (error: any) => {
          console.error('Error generating task report:', error);
        }
      });
    } else if (this.selectedUser && this.selectedProject) {
      this.reportService.generateUserReport(this.selectedUser.id, this.selectedProject.id, startTimeWithSeconds, endTimeWithSeconds).subscribe({
        next: (response: any[]) => {
          console.log('User report response:', response);
          this.reportData = response;
          this.sortedReportData = [...this.reportData];
          this.groupedReportData = this.groupByTask ? this.groupLogsByTask(this.reportData) : [];
        },
        error: (error: any) => {
          console.error('Error generating user report:', error);
        }
      });
    } else if (this.selectedProject) {
      this.reportService.generateProjectReport(this.selectedProject.id, startTimeWithSeconds, endTimeWithSeconds).subscribe({
        next: (response: any[]) => {
          console.log('Project report response:', response);
          this.reportData = response;
          this.sortedReportData = [...this.reportData];
          this.groupedReportData = this.groupByTask ? this.groupLogsByTask(this.reportData) : [];
        },
        error: (error: any) => {
          console.error('Error generating project report:', error);
        }
      });
    } else {
      this.reportService.generateUserTimeLogsReport(startTimeWithSeconds, endTimeWithSeconds).subscribe({
        next: (response: any[]) => {
          console.log('User time logs report response:', response);
          this.reportData = response;
          this.sortedReportData = [...this.reportData];
          this.groupedReportData = this.groupByTask ? this.groupLogsByTask(this.reportData) : [];
        },
        error: (error: any) => {
          console.error('Error generating user time logs report:', error);
        }
      });
    }
  }



  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.sortedReportData = [...this.reportData].sort((a: Log, b: Log) => {
      const valueA = this.getPropertyValue(a, column);
      const valueB = this.getPropertyValue(b, column);

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      } else if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });

    if (this.groupByTask) {
      this.groupedReportData = this.groupLogsByTask(this.sortedReportData);
    }
  }


  getPropertyValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => {
      if (p === 'timeLog') {
        return o && o[p];
      } else {
        return o && o[p];
      }
    }, obj);
  }

  toggleGroupByTask(): void {
    this.groupByTask = !this.groupByTask;
    if (this.groupByTask) {
      this.groupedReportData = this.groupLogsByTask(this.sortedReportData);
    } else {
      this.groupedReportData = [];
    }
  }

  groupLogsByTask(logs: Log[]): any[] {
    const grouped = logs.reduce((groups, log) => {
      const task = log.timeLog.task ? log.timeLog.task.name : 'No Task';
      if (!groups[task]) {
        groups[task] = { logs: [], totalMinutes: 0 };
      }
      groups[task].logs.push(log);
      groups[task].totalMinutes += log.timeLog.minutes || 0;
      return groups;
    }, {} as { [key: string]: { logs: Log[]; totalMinutes: number } });

    Object.keys(grouped).forEach(task => {
      grouped[task].logs.sort((a: Log, b: Log) => {
        const valueA = this.getPropertyValue(a, this.sortColumn);
        const valueB = this.getPropertyValue(b, this.sortColumn);

        if (valueA < valueB) {
          return this.sortDirection === 'asc' ? -1 : 1;
        } else if (valueA > valueB) {
          return this.sortDirection === 'asc' ? 1 : -1;
        } else {
          return 0;
        }
      });
    });

    const sortedGroups = Object.keys(grouped).sort((a, b) => {
      if (this.sortColumn === 'timeLog.task.name') {
        if (a < b) return this.sortDirection === 'asc' ? -1 : 1;
        if (a > b) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      } else if (this.sortColumn === 'timeLog.minutes') {
        const totalA = grouped[a].totalMinutes;
        const totalB = grouped[b].totalMinutes;
        if (totalA < totalB) return this.sortDirection === 'asc' ? -1 : 1;
        if (totalA > totalB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      } else {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      }
    });

    return sortedGroups.map(task => ({
      task: task,
      logs: grouped[task].logs,
      totalMinutes: grouped[task].totalMinutes,
      expanded: this.groupedReportData.find(g => g.task === task)?.expanded || false // Preserve expanded state
    }));
  }

  toggleGroupExpansion(group: any): void {
    group.expanded = !group.expanded;
  }

  downloadTaskPdf(taskId: string, taskName: string): void {
    const startTimeWithSeconds = this.startTime ? this.startTime + ':00' : '';
    const endTimeWithSeconds = this.endTime ? this.endTime + ':00' : '';

    this.http.get(`http://localhost:8080/api/reports/task/pdf?taskId=${taskId}&startTime=${startTimeWithSeconds}&endTime=${endTimeWithSeconds}&taskName=${taskName}`, {
      responseType: 'blob',
      withCredentials: true
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'task_report.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading task PDF:', error);
      },
      complete: () => {
        console.log('PDF download completed.');
      }
    });
  }

  downloadProjectPdf(projectId: string, projectName: string): void {
    const startTimeWithSeconds = this.startTime ? this.startTime + ':00' : '';
    const endTimeWithSeconds = this.endTime ? this.endTime + ':00' : '';

    this.http.get(`http://localhost:8080/api/reports/project/pdf?projectId=${projectId}&startTime=${startTimeWithSeconds}&endTime=${endTimeWithSeconds}&projectName=${projectName}`, {
      responseType: 'blob',
      withCredentials: true
    }).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project_report.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading project PDF:', error);
      },
      complete: () => {
        console.log('Project PDF download completed.');
      }
    });
  }

  downloadUserPdf(userId: string, projectId: string, userName: string): void {
    const startTimeWithSeconds = this.startTime ? this.startTime + ':00' : '';
    const endTimeWithSeconds = this.endTime ? this.endTime + ':00' : '';

    this.http.get(`http://localhost:8080/api/reports/user/pdf?userId=${userId}&projectId=${projectId}&startTime=${startTimeWithSeconds}&endTime=${endTimeWithSeconds}&userName=${userName}`, {
      responseType: 'blob',
      withCredentials: true
    }).subscribe(
      (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user_report.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
      }, (error) => {
        console.error('Error downloading user PDF:', error);
      });
  }

  getSelectedTaskName(): string {
    const task = this.tasks.find(t => t.id === this.selectedTask);
    return task ? task.name : '';
  }

  getSelectedProjectName(): string {
    const project = this.projects.find(p => p.id === this.selectedProject);
    return project ? project.name : '';
  }

  getSelectedUserName(): string {
    const user = this.users.find(u => u.id === this.selectedUser);
    return user ? user.name : '';
  }
}
