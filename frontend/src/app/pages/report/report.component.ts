import { Component, OnInit } from '@angular/core';
import { ReportService } from '../../services/report.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-report',
  imports: [CommonModule, FormsModule],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  selectedProject: string = '';
  selectedTask: string = '';
  selectedUser: string = '';
  startTime: string = '';
  endTime: string = '';
  reportData: any[] = [];

  projects: any[] = [];
  tasks: any[] = [];
  users: any[] = [];

  constructor(private reportService: ReportService, private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchProjects();
  }

  fetchProjects(): void {
    this.http.get<any>('http://localhost:8080/api/projects', { withCredentials: true }).subscribe({
    next: (response) =>
    {
      console.log('Projects response:', response);
      this.projects = [...response.ownedProjects, ...response.collaboratedProjects];
    }
  ,
    error: (error) => {
      console.error('Error fetching projects:', error);
    }
  });
  }

  fetchTasks(projectId: string): void {
    this.http.get<any>(`http://localhost:8080/api/tasks/project/${projectId}`, { withCredentials: true }).subscribe({
    next: (response) =>
    {
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

  onProjectChange(): void {
    if (this.selectedProject) {
      this.fetchTasks(this.selectedProject);
      this.fetchUsers(this.selectedProject);
    } else {
      this.tasks = [];
      this.users = [];
    }
  }

  generateReport(): void {
    const startTimeWithSeconds = this.startTime ? this.startTime + ':00' : null;
    const endTimeWithSeconds = this.endTime ? this.endTime + ':00' : null;

    if (this.selectedTask) {
      this.reportService.generateTaskReport(this.selectedTask, startTimeWithSeconds, endTimeWithSeconds).subscribe({
        next: (response: any[]) => {
          console.log('Task report response:', response);
          this.reportData = response;
        },
        error: (error: any) => {
          console.error('Error generating task report:', error);
        },
        complete: () => {
          console.log('Task report generation completed.');
        }
      });

    } else if (this.selectedUser && this.selectedProject) {
      this.reportService.generateUserReport(this.selectedUser, this.selectedProject, startTimeWithSeconds, endTimeWithSeconds).subscribe({
        next: (response: any[]) => {
          console.log('User report response:', response);
          this.reportData = response;
        },
        error: (error: any) => {
          console.error('Error generating user report:', error);
        },
        complete: () => {
          console.log('User report generation completed.');
        }
      });

    } else if (this.selectedProject) {
      this.reportService.generateProjectReport(this.selectedProject, startTimeWithSeconds, endTimeWithSeconds).subscribe({
        next: (response: any[]) => {
          console.log('Project report response:', response);
          this.reportData = response;
        },
        error: (error: any) => {
          console.error('Error generating project report:', error);
        },
        complete: () => {
          console.log('Project report generation completed.');
        }
      });
    }
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
