import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {ReportComponent} from '../old-components-from-dashboard/report/report.component';
import {InvitationsComponent} from '../old-components-from-dashboard/invitations-component/invitations.component';
import {LogTimeComponent} from '../old-components-from-dashboard/log-time/log-time.component';
import {TaskManagementComponent} from '../old-components-from-dashboard/task-management/task-management.component';
import {UpcomingDeadlinesComponent} from './upcoming-deadlines/upcoming-deadlines.component';
import {YourProfileComponent} from './your-profile/your-profile.component';
import {ActiveProjectsComponent} from './active-projects/active-projects.component';
import {EmployersComponent} from './employers/employers.component';
import {EmployeesComponent} from './employees/employees.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, UpcomingDeadlinesComponent, YourProfileComponent, ActiveProjectsComponent, EmployersComponent, EmployeesComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent  {

}
