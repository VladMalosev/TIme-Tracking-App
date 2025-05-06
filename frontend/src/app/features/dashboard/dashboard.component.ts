import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {UpcomingDeadlinesComponent} from './upcoming-deadlines/upcoming-deadlines.component';
import {YourProfileComponent} from './your-profile/your-profile.component';
import {ActiveProjectsComponent} from './active-projects/active-projects.component';
import {InvitationsComponent} from './invitations/invitations.component';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, UpcomingDeadlinesComponent, YourProfileComponent, ActiveProjectsComponent, InvitationsComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent  {

}
