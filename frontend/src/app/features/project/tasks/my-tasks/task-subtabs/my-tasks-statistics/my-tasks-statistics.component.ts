import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { DashboardStatsComponent } from './dashboard-stats/dashboard-stats.component';
import { RecentTimeEntriesComponent } from './recent-time-entries/recent-time-entries.component';
import { ProjectContextService } from '../../../../../../services/project-context.service';
import { ExportTimeLogService } from '../../../../../../services/my-tasks/my-tasks-statistics/export-time-log.service';
import { saveAs } from 'file-saver';
import {TimeLogData, UserInfo, TimeLogEntry} from '../../../../../../models/statistics-csv';

@Component({
  selector: 'app-my-tasks-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIcon,
    MatButtonModule,
    MatDivider,
    MatTableModule,
    DashboardStatsComponent,
    RecentTimeEntriesComponent
  ],
  templateUrl: './my-tasks-statistics.component.html',
  styleUrls: ['./my-tasks-statistics.component.scss']
})
export class MyTasksStatisticsComponent implements OnInit {
  timeLogData: TimeLogData[] = [];
  displayedColumns: string[] = ['startTime', 'endTime', 'duration', 'description'];
  currentUserInfo: UserInfo | null = null;

  constructor(
    private projectContext: ProjectContextService,
    private exportTimeService: ExportTimeLogService
  ) {}

  ngOnInit(): void {}

  exportTimeLogs(): void {
    const projectId = this.projectContext.getCurrentProjectId();
    if (!projectId) {
      console.error("No project selected");
      return;
    }

    this.exportTimeService.getTimeLogsForExport(projectId).subscribe({
      next: (data: TimeLogData[]) => {
        console.log("RAW RESPONSE DATA:", JSON.stringify(data, null, 2));
        this.timeLogData = data;
        if (data.length > 0) {
          this.currentUserInfo = data[0].userInfo;
        }
        this.generateCSV(data);
      },
      error: (err) => console.error("Error exporting time logs:", err)
    });
  }


  private generateCSV(data: TimeLogData[]): void {
    let csvContent = '';

    data.forEach((entry: TimeLogData) => {
      csvContent += `User: ${entry.userInfo.userName}\n`;
      csvContent += `Email: ${entry.userInfo.userEmail}\n`;
      csvContent += `Task: ${entry.userInfo.taskName}\n\n`;

      csvContent += 'Start Date & Time,End Date & Time,Duration,Description\n';

      entry.logs.forEach((log: TimeLogEntry) => {
        const duration = this.calculateDuration(log.startTime, log.endTime);
        csvContent += [
          `"${this.formatDateTimeFull(log.startTime)}"`,
          `"${this.formatDateTimeFull(log.endTime)}"`,
          this.formatDuration(duration),
          `"${log.description || ''}"`
        ].join(',') + '\n';
      });

      csvContent += '\nSummary:\n';
      csvContent += `Total Logs: ${entry.summary.totalLogs}\n`;
      csvContent += `Total Time: ${this.formatDuration(entry.summary.totalTime)}\n`;
      csvContent += `First Entry: ${this.formatDateTimeFull(entry.summary.firstEntry)}\n`;
      csvContent += `Last Entry: ${this.formatDateTimeFull(entry.summary.lastEntry)}\n\n`;

      csvContent += '----------------------------------------\n\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const projectName = this.projectContext.getCurrentProjectId() || 'project';
    const dateStr = new Date().toISOString().split('T')[0];
    saveAs(blob, `detailed_time_logs_${projectName.replace(/[^a-z0-9]/gi, '_')}_${dateStr}.csv`);
  }

  formatDateTimeFull(dateTime: string | null): string {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  calculateDuration(start: string, end: string): number {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    return Math.max(0, durationMs) / (1000 * 60);
  }

  formatDuration(minutes: number | undefined | null): string {
    if (!minutes) return 'N/A';

    const roundedMinutes = Math.round(minutes * 100) / 100;

    if (roundedMinutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${seconds}s`;
    }

    if (roundedMinutes < 60) {
      return `${roundedMinutes}m`;
    }

    const hours = Math.floor(roundedMinutes / 60);
    const mins = Math.round(roundedMinutes % 60);

    const hoursText = hours === 1 ? 'hour' : 'hours';
    const minsText = mins === 1 ? 'minute' : 'minutes';

    return `${hours} ${hoursText} ${mins} ${minsText}`;
  }
}
