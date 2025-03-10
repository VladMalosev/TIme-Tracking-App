import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {InvitationsComponent} from '../invitations-component/invitations.component';
import {LogTimeComponent} from '../log-time/log-time.component';
import {TaskManagementComponent} from '../task-management/task-management.component';
import {ReportComponent} from '../report/report.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, InvitationsComponent, LogTimeComponent, TaskManagementComponent, ReportComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  userName!: string;
  userEmail!: string;
  userId!: string;

  startTime: Date | null = null;
  timeLogs: any[] = [];
  errorMessage: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
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
    this.http.get<any>(`http://localhost:8080/api/timelogs/user/${this.userId}`, { withCredentials: true }).subscribe(
      (response) => {
        console.log('Time logs response:', response);
        this.timeLogs = Array.isArray(response) ? response : response.timeLogs || [];
      },
      (error) => {
        console.error('Error fetching time logs:', error);
      }
    );
  }


  onFilterApplied(filterCriteria: any): void {
    this.http
      .post<any[]>('http://localhost:8080/api/timelogs/filter', filterCriteria, { withCredentials: true })
      .subscribe(
        (response) => {
          this.timeLogs = response;
        },
        (error) => {
          console.error('Error fetching filtered time logs:', error);
        }
      );
  }
}
