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
  reportData: any = null;

  projects: any[] = [];
  tasks: any[] = [];
  users: any[] = [];

  constructor(private reportService: ReportService, private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchProjects();
  }
  fetchProjects(): void {
    this.http.get<any>('http://localhost:8080/api/projects', { withCredentials: true }).subscribe(
      (response) => {
        console.log('Projects response:', response);
        this.projects = [...response.ownedProjects, ...response.collaboratedProjects];
        },
      (error) => {
        console.error('Error fetching projects:', error);
      }
    );
  }

  fetchTasks(projectId: string): void {
    this.http.get<any>(`http://localhost:8080/api/tasks/project/${projectId}`, { withCredentials: true }).subscribe(
      (response) => {
        console.log('Tasks response:', response);
        this.tasks = Array.isArray(response) ? response : response.tasks || [];
      },
      (error) => {
        console.error('Error fetching tasks:', error);
      }
    );
  }

  fetchUsers(projectId: string): void {
    this.http.get<any>(`http://localhost:8080/api/projects/${projectId}/users`, { withCredentials: true }).subscribe(
      (response) => {
        console.log('Users response:', response);
        this.users = response;
      },
      (error) => {
        console.error('Error fetching users:', error);
      }
    );
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
    if (this.selectedTask) {
      this.reportService.generateTaskReport(this.selectedTask, this.startTime, this.endTime)
        .subscribe((response: Blob) => {
          this.downloadFile(response, 'task_report.pdf');
        }, (error) => {
          console.error('Error generating task report:', error);
        });
    } else if (this.selectedProject) {
      this.reportService.generateProjectReport(this.selectedProject, this.startTime, this.endTime)
        .subscribe((response: Blob) => {
          this.downloadFile(response, 'project_report.pdf');
        }, (error) => {
          console.error('Error generating project report:', error);
        });
    } else if (this.selectedUser) {
      this.reportService.generateUserReport(this.selectedUser, this.startTime, this.endTime)
        .subscribe((response: Blob) => {
          this.downloadFile(response, 'user_report.pdf');
        }, (error) => {
          console.error('Error generating user report:', error);
        });
    }
  }

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
