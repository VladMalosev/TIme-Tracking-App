import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { DashboardStatsComponent } from './dashboard-stats/dashboard-stats.component';
import { RecentTimeEntriesComponent } from './recent-time-entries/recent-time-entries.component';

@Component({
  selector: 'app-my-tasks-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIcon,
    MatButtonModule,
    MatDivider,
    DashboardStatsComponent,
    RecentTimeEntriesComponent
  ],
  templateUrl: './my-tasks-statistics.component.html',
  styleUrls: ['./my-tasks-statistics.component.scss']
})
export class MyTasksStatisticsComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
  }
}
