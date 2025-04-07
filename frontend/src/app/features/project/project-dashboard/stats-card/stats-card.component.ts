import { Component, Input } from '@angular/core';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-stats-card',
  templateUrl: './stats-card.component.html',
  imports: [
    MatIcon
  ],
  styleUrls: ['./stats-card.component.scss']
})
export class StatsCardComponent {
  totalTasks: number = 0;
  completedTasks: number = 0;
  totalHoursLogged: number = 0;
  upcomingDeadlines: number = 0;
}
