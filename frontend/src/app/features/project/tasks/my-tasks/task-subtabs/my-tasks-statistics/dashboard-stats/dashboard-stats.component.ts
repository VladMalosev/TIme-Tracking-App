import {Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import {Observable, Subject, takeUntil, withLatestFrom} from 'rxjs';
import {
  DashboardStatsService
} from '../../../../../../../services/my-tasks/my-tasks-statistics/dashboard-stats.service';
import {ProductivityStats, TaskStats} from '../../../../../../../models';
import { NgIf, NgForOf, SlicePipe, AsyncPipe } from '@angular/common';
import {MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {MatDivider} from '@angular/material/divider';
import {ProjectContextService} from '../../../../../../../services/project-context.service';
import {AuthService} from '../../../../../../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard-stats',
  templateUrl: './dashboard-stats.component.html',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardTitle,
    MatCardSubtitle,
    MatIcon,
    MatDivider,
    AsyncPipe,
    SlicePipe,
    NgIf,
    NgForOf
  ],
  styleUrls: ['./dashboard-stats.component.scss']
})
export class DashboardStatsComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  @ViewChild('completionChart') completionChartRef!: ElementRef;
  @ViewChild('logPatternsChart') logPatternsChartRef!: ElementRef;
  private completionChart?: Chart;
  private logPatternsChart?: Chart;

  taskStats$: Observable<TaskStats>;
  productivityStats$: Observable<ProductivityStats>;

  constructor(
    public statsService: DashboardStatsService,
    private authService: AuthService,
    private projectContextService: ProjectContextService
  ) {
    Chart.register(...registerables);
    this.taskStats$ = this.statsService.taskStats$;
    this.productivityStats$ = this.statsService.productivityStats$;
  }


  ngOnInit(): void {
    this.authService.userId$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(userId => {
      if (userId) {
        const projectId = this.projectContextService.getCurrentProjectId();
        console.log('Loading stats for user:', userId, 'project:', projectId);
        this.statsService.loadAllStats(userId, projectId);
      }
    });

    this.projectContextService.currentProjectId$.pipe(
      takeUntil(this.destroy$),
      withLatestFrom(this.authService.userId$)
    ).subscribe(([projectId, userId]) => {
      if (userId) {
        this.statsService.loadAllStats(userId, projectId);
      }
    });
  }

  private initCompletionChart(taskStats: TaskStats): void {
    if (this.completionChart) {
      this.completionChart.destroy();
    }

    if (this.completionChartRef?.nativeElement) {
      const ctx = this.completionChartRef.nativeElement.getContext('2d');
      const totalTasks = taskStats.totalTasks || 1;

      this.completionChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Task Completion'],
          datasets: [
            {
              label: `Completed (${taskStats.completed})`,
              data: [taskStats.completed],
              backgroundColor: '#2e7d32',
              borderWidth: 0
            },
            {
              label: `In Progress (${taskStats.inProgress})`,
              data: [taskStats.inProgress],
              backgroundColor: '#ff8f00',
              borderWidth: 0
            },
            {
              label: `Pending (${taskStats.pending})`,
              data: [taskStats.pending],
              backgroundColor: '#616161',
              borderWidth: 0
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          scales: {
            x: { stacked: true, max: totalTasks },
            y: { stacked: true }
          }
        }
      });
    }
  }

  private initLogPatternsChart(logPatterns: any): void {
    if (this.logPatternsChart) {
      this.logPatternsChart.destroy();
    }

    if (this.logPatternsChartRef?.nativeElement) {
      const ctx = this.logPatternsChartRef.nativeElement.getContext('2d');
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dailyData = logPatterns.dailyDistribution
        .map((item: any) => ({ day: Number(item.day), count: Number(item.count) }))
        .sort((a: any, b: any) => a.day - b.day);

      this.logPatternsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dailyData.map((item: any) => dayNames[item.day]),
          datasets: [{
            label: 'Time Logs Created',
            data: dailyData.map((item: any) => item.count),
            backgroundColor: '#3f51b5'
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.completionChart?.destroy();
    this.logPatternsChart?.destroy();
  }

  ngAfterViewInit(): void {
    this.setupChartSubscriptions();
  }

  private setupChartSubscriptions(): void {
    this.taskStats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((taskStats: TaskStats) => {
      if (taskStats) {
        this.initCompletionChart(taskStats);
      }
    });

    this.productivityStats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((prodStats: ProductivityStats) => {
      if (prodStats?.logPatterns) {
        this.initLogPatternsChart(prodStats.logPatterns);
      }
    });
  }
}

