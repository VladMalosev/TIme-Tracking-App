import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { combineLatest } from 'rxjs';
import { StatsService } from '../../../../services/dashboard/stats.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ProjectContextService } from '../../../../services/project-context.service';
import { DecimalPipe, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {Chart, registerables} from 'chart.js';

Chart.register(...registerables)

@Component({
  selector: 'app-stats-card',
  templateUrl: './stats-card.component.html',
  standalone: true,
  imports: [
    MatIcon,
    FormsModule,
    DecimalPipe,
    MatProgressSpinner,
    NgIf,
  ],
  styleUrls: ['./stats-card.component.scss']
})
export class StatsCardComponent implements OnInit, OnDestroy {
  stats: any = {
    totalLoggedTime: 0,
    weeklyAverage: 0,
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    activeTasks: 0,
    mostProductiveDay: '',
    pendingTasks: 0
  };

  isLoading = true;
  private chart: Chart | null = null;

  constructor(
    private statsService: StatsService,
    private authService: AuthService,
    private projectContextService: ProjectContextService
  ) {}

  ngOnInit(): void {
    this.authService.userId$.subscribe(userId => {
      if (userId) {
        this.loadStatistics(userId);
      } else {
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  loadStatistics(userId: string): void {
    const projectId = this.projectContextService.getCurrentProjectId();

    this.isLoading = true;
    const projectFilter = projectId ? `?projectId=${projectId}` : '';

    combineLatest([
      this.statsService.getTimeStats(userId, projectFilter),
      this.statsService.getTaskStats(userId, projectFilter),
      this.statsService.getProductivityStats(userId, projectFilter)
    ]).subscribe({
      next: ([timeStats, taskStats, productivityStats]) => {
        this.stats = {
          totalLoggedTime: timeStats.totalLogged || 0,
          weeklyAverage: timeStats.weeklyAverage || 0,
          totalTasks: taskStats.totalTasks || 0,
          completedTasks: taskStats.completed || 0,
          completionRate: taskStats.totalTasks > 0
            ? (taskStats.completed / taskStats.totalTasks * 100)
            : 0,
        };
        this.isLoading = false;

        setTimeout(() => this.createChart(), 0);
      },
      error: (err) => {
        console.error('Failed to load statistics:', err);
        this.isLoading = false;
      }
    });
  }

  formatMinutes(minutes: number): string {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  createChart(): void {
    const canvas = document.getElementById('completionChart') as HTMLCanvasElement | null;

    if (!canvas) {
      console.warn('Canvas element not found');
      return;
    }

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    if (this.stats.totalTasks === 0) {
      return;
    }

    this.chart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['Completed', 'Remaining'],
        datasets: [{
          data: [
            this.stats.completedTasks,
            Math.max(0, this.stats.totalTasks - this.stats.completedTasks)
          ],
          backgroundColor: ['#3f51b5', '#e0e0e0'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
  isStatsEmpty(): boolean {
    return this.stats.totalLoggedTime === 0 &&
      this.stats.weeklyAverage === 0 &&
      this.stats.completedTasks === 0 &&
      this.stats.totalTasks === 0 &&
      this.stats.completionRate === 0;
  }

}
