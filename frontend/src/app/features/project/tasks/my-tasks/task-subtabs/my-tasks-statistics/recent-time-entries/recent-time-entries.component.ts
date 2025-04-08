import { Component, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { TimeLogDisplay } from '../../../../../../../models';
import { TimeLogService } from '../../../../../../../services/my-tasks/my-tasks-statistics/time-log.service';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../../../core/auth/auth.service';
import { ProjectContextService } from '../../../../../../../services/project-context.service';
import { Subject, takeUntil, combineLatest } from 'rxjs';

@Component({
  selector: 'app-recent-time-entries',
  templateUrl: './recent-time-entries.component.html',
  styleUrls: ['./recent-time-entries.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatTableModule,
    MatPaginator,
    MatButtonModule,
    DatePipe
  ]
})
export class RecentTimeEntriesComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['date', 'taskName', 'duration', 'description'];
  dataSource = new MatTableDataSource<TimeLogDisplay>([]);
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private timeLogService: TimeLogService,
    private authService: AuthService,
    private projectContextService: ProjectContextService
  ) {}

  ngOnInit(): void {
    console.log('Component initialized');

    combineLatest([
      this.authService.userId$,
      this.projectContextService.currentProjectId$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([userId, projectId]) => {
          if (userId) {
            this.timeLogService.loadTimeLogs(userId, projectId);
          } else {
            console.warn('No userId available');
          }
        },
        error: (err) => console.error('Error in combineLatest:', err)
      });

    this.timeLogService.timeLogs$.pipe(
      takeUntil(this.destroy$))
      .subscribe({
        next: (logs) => {
          this.dataSource.data = logs;
        },
        error: (err) => console.error('Error in timeLogs$ subscription:', err)
      });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatMinutes(minutes: number): string {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
}
