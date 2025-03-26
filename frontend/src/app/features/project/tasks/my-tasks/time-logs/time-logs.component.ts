import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import {TimeLogService} from '../../../../../services/my-tasks/time-log.service';

@Component({
  selector: 'app-time-logs',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './time-logs.component.html',
  styleUrls: ['./time-logs.component.scss']
})
export class TimeLogsComponent {
  projects: any[] = [];
  selectedProject: string = '';
  logDescription: string = '';
  timeSpent: number = 0;
  logDate: Date = new Date();
  displayedColumns: string[] = ['project', 'description', 'timeSpent', 'date', 'actions'];
  logs: any[] = [];

  constructor(private timeLogService: TimeLogService) {}

  // createLog(): void {
  //   if (!this.selectedProject || !this.logDescription || this.timeSpent <= 0) {
  //     return;
  //   }
  //
  //   const logData = {
  //     projectId: this.selectedProject,
  //     description: this.logDescription,
  //     timeSpent: this.timeSpent,
  //     date: this.logDate
  //   };
  //
  //   this.timeLogService.createManualTimeLog(logData).subscribe({
  //     next: (log) => {
  //       this.logs = [...this.logs, log];
  //       this.resetForm();
  //     },
  //     error: (err) => console.error('Error creating log:', err)
  //   });
  // }

  deleteLog(logId: string): void {
    this.timeLogService.deleteTimeLog(logId).subscribe({
      next: () => {
        this.logs = this.logs.filter(log => log.id !== logId);
      },
      error: (err) => console.error('Error deleting log:', err)
    });
  }

  private resetForm(): void {
    this.selectedProject = '';
    this.logDescription = '';
    this.timeSpent = 0;
    this.logDate = new Date();
  }

  getProjectName(projectId: string): string {
    const project = this.projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  }
}
