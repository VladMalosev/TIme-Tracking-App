import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import {Subject, takeUntil, forkJoin, finalize, catchError, of} from 'rxjs';
import { AuthService } from '../../../../../../core/auth/auth.service';
import { ProjectContextService } from '../../../../../../services/project-context.service';
import { MatIcon } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import {MatDivider} from '@angular/material/divider';
import {ProductivityStats, TaskStats, TimeLog, TimeLogDisplay, TimeStats} from '../../../../../../models';

Chart.register(...registerables);



@Component({
  selector: 'app-my-tasks-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatIcon,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatDivider
  ],
  templateUrl: './my-tasks-statistics.component.html',
  styleUrls: ['./my-tasks-statistics.component.scss']
})
export class MyTasksStatisticsComponent implements OnInit, AfterViewInit {
  private destroy$ = new Subject<void>();
  isLoading = true;
  userId: string | null = null;
  currentProjectId: string | null = null;

  timeStats: TimeStats = {
    totalLogged: 0,
    weeklyAverage: 0,
    taskDistribution: []
  };

  taskStats: TaskStats = {
    totalTasks: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  };

  productivityStats: ProductivityStats = {
    frequentTasks: []
  };

  // Time logs table
  timeLogsDataSource = new MatTableDataSource<TimeLogDisplay>([]);
  timeLogsDisplayedColumns: string[] = ['date', 'taskName', 'duration', 'description'];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('logPatternsChart') logPatternsChartRef!: ElementRef<HTMLCanvasElement>;
  private logPatternsChart?: Chart;

  @ViewChild('completionChart') completionChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('peakHoursChart') peakHoursChartRef!: ElementRef<HTMLCanvasElement>;
  private completionChart?: Chart;
  private peakHoursChart?: Chart;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private projectContextService: ProjectContextService
  ) {}

  ngOnInit(): void {
    console.log('ngOnInit started');

    this.userId = this.authService.getUserId() ?? null;
    this.currentProjectId = this.projectContextService.getCurrentProjectId();

    this.loadStatistics();

    this.authService.userId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(userId => {
        console.log('UserId subscription triggered, userId:', userId);
        if (userId !== this.userId) {
          this.userId = userId;
          this.loadStatistics();
        }
      });

    this.projectContextService.currentProjectId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(projectId => {
        console.log('ProjectId subscription triggered, projectId:', projectId);
        if (projectId !== this.currentProjectId) {
          this.currentProjectId = projectId;
          this.loadStatistics();
        }
      });

    console.log('ngOnInit completed');
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit called, setting paginator');
    this.timeLogsDataSource.paginator = this.paginator;
  }


  loadStatistics(): void {
    console.log('loadStatistics called', {
      userId: this.userId,
      currentProjectId: this.currentProjectId,
      isLoading: this.isLoading
    });

    if (!this.userId) {
      console.log('No userId available, skipping load');
      this.isLoading = false;
      return;
    }

    if (this.isLoading) {
      console.log('Already loading, skipping duplicate call');
      return;
    }

    this.isLoading = true;
    const projectFilter = this.currentProjectId ? `?projectId=${this.currentProjectId}` : '';
    const baseUrl = 'http://localhost:8080';

    console.log('Making API requests with:', {
      projectFilter,
      urls: [
        `${baseUrl}/api/timelogs/user/${this.userId}/stats${projectFilter}`, {withCredentials: true},
        `${baseUrl}/api/tasks/user/${this.userId}/stats${projectFilter}`, {withCredentials: true},
        `${baseUrl}/api/analytics/user/${this.userId}${projectFilter}`, {withCredentials: true},
        `${baseUrl}/api/timelogs/user/${this.userId}${projectFilter}`, {withCredentials: true},
      ]
    });

    forkJoin([
      this.http.get<TimeStats>(`${baseUrl}/api/timelogs/user/${this.userId}/stats${projectFilter}`, { withCredentials: true }).pipe(
        catchError(err => {
          console.error('Error loading time stats:', err);
          return of(this.timeStats);
        })
      ),

      this.http.get<TaskStats>(`${baseUrl}/api/tasks/user/${this.userId}/stats${projectFilter}`, { withCredentials: true }).pipe(
        catchError(err => {
          console.error('Error loading task stats:', err);
          return of(this.taskStats);
        })
      ),
      this.http.get<ProductivityStats>(`${baseUrl}/api/analytics/user/${this.userId}${projectFilter}`, { withCredentials: true }).pipe(
        catchError(err => {
          console.error('Error loading productivity stats:', err);
          return of(this.productivityStats);
        })
      ),
      this.http.get<TimeLog[]>(`${baseUrl}/api/timelogs/user/${this.userId}${projectFilter}`, { withCredentials: true }).pipe(
        catchError(err => {
          console.error('Error loading time logs:', err);
          return of([]);
        })
      ),
      this.http.get<any>(`${baseUrl}/api/analytics/user/${this.userId}/log-patterns${projectFilter}`, { withCredentials: true }).pipe(
        catchError(err => {
          console.error('Error loading log patterns:', err);
          return of({ hourlyDistribution: [], dailyDistribution: [] });
        })
      )
    ]).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        console.log('API requests completed, finalizing');
        this.isLoading = false;
        setTimeout(() => {
          console.log('Initializing charts after timeout');
          this.initCharts();
        }, 0);
      })
    ).subscribe({
      next: ([timeData, taskData, prodData, timeLogs, logPatterns]) => {
        console.log('API response received:', {
          timeData,
          taskData,
          prodData,
          timeLogs: timeLogs.length
        });

        this.timeStats = {
          totalLogged: timeData?.totalLogged || 0,
          weeklyAverage: timeData?.weeklyAverage || 0,
          taskDistribution: timeData?.taskDistribution || []
        };

        this.taskStats = {
          totalTasks: taskData?.totalTasks || 0,
          completed: taskData?.completed || 0,
          inProgress: taskData?.inProgress || 0,
          pending: taskData?.pending || 0
        };

        this.productivityStats = {
          frequentTasks: prodData?.frequentTasks || [],
          logPatterns: logPatterns
        };

        this.timeLogsDataSource.data = timeLogs.map(log => ({
          date: new Date(log.startTime),
          taskName: log.task?.name || 'No task',
          duration: log.minutes || 0,
          description: log.description || 'No description'
        }));

        console.log('Data assigned to component properties:', {
          timeStats: this.timeStats,
          taskStats: this.taskStats,
          productivityStats: this.productivityStats,
          timeLogsCount: this.timeLogsDataSource.data.length
        });
      },
      error: (err) => {
        console.error('Failed to load statistics:', err);
      }
    });
  }

  private initCharts(): void {
    console.log('initCharts called');

    // Destroy existing charts first
    if (this.completionChart) {
      this.completionChart.destroy();
    }
    if (this.peakHoursChart) {
      this.peakHoursChart.destroy();
    }

    // Completion Chart (Horizontal Stacked Bar)
    if (this.completionChartRef?.nativeElement) {
      const ctx = this.completionChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const totalTasks = this.taskStats.totalTasks || 1; // Avoid division by zero

        this.completionChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Task Completion'],
            datasets: [
              {
                label: `Completed (${this.taskStats.completed})`,
                data: [this.taskStats.completed],
                backgroundColor: '#2e7d32',
                borderWidth: 0,
                borderSkipped: false,
              },
              {
                label: `In Progress (${this.taskStats.inProgress})`,
                data: [this.taskStats.inProgress],
                backgroundColor: '#ff8f00',
                borderWidth: 0,
                borderSkipped: false,
              },
              {
                label: `Pending (${this.taskStats.pending})`,
                data: [this.taskStats.pending],
                backgroundColor: '#616161',
                borderWidth: 0,
                borderSkipped: false,
              }
            ]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                stacked: true,
                max: totalTasks,
                grid: {
                  display: false
                },
                ticks: {
                  callback: (value) => {
                    if (value === totalTasks) {
                      return `${totalTasks} total tasks`;
                    }
                    return value;
                  }
                }
              },
              y: {
                stacked: true,
                grid: {
                  display: false
                }
              }
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 12,
                  padding: 20,
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.dataset.label || '';
                    const value = context.raw as number;
                    const percentage = Math.round((value / totalTasks) * 100);
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
      }
    }

    if (this.logPatternsChartRef?.nativeElement && this.productivityStats.logPatterns?.dailyDistribution) {
      const ctx = this.logPatternsChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const dailyData = this.productivityStats.logPatterns.dailyDistribution.map(item => ({
          day: Number(item.day),
          count: Number(item.count)
        }));

        dailyData.sort((a, b) => a.day - b.day);

        this.logPatternsChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: dailyData.map(item => dayNames[item.day]),
            datasets: [{
              label: 'Time Logs Created',
              data: dailyData.map(item => item.count),
              backgroundColor: '#3f51b5',
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'When Do You Log Your Time?',
                font: {
                  size: 16
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => {
                    return `${context.parsed.y} logs on ${context.label}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Time Logs'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Day of Week'
                }
              }
            }
          }
        });
      }
    }
  }

  getMostProductiveDay(): string | null {
    if (!this.productivityStats.logPatterns?.dailyDistribution?.length) return null;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const maxEntry = this.productivityStats.logPatterns.dailyDistribution.reduce((prev, current) =>
      (Number(prev.count) > Number(current.count)) ? prev : current);

    return days[Number(maxEntry.day)];
  }

  getLeastProductiveDay(): string | null {
    if (!this.productivityStats.logPatterns?.dailyDistribution?.length) return null;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const minEntry = this.productivityStats.logPatterns.dailyDistribution.reduce((prev, current) =>
      (Number(prev.count) < Number(current.count)) ? prev : current);

    return days[Number(minEntry.day)];
  }

  formatMinutes(minutes: number): string {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  formatEfficiency(efficiency: number): string {
    return (efficiency * 100).toFixed(1) + '%';
  }

  ngOnDestroy(): void {
    if (this.completionChart) {
      this.completionChart.destroy();
    }
    if (this.peakHoursChart) {
      this.peakHoursChart.destroy();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
