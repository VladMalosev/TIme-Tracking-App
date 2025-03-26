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
import {TaskLogService} from '../../../../../services/my-tasks/task-log.service';

@Component({
  selector: 'app-task-logs',
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
  templateUrl: './task-logs.component.html',
  styleUrls: ['./task-logs.component.scss']
})
export class TaskLogsComponent {
  tasks: any[] = [];
  selectedTask: string = '';
  logDescription: string = '';
  timeSpent: number = 0;
  logDate: Date = new Date();
  displayedColumns: string[] = ['task', 'description', 'timeSpent', 'date', 'actions'];
  logs: any[] = [];

  constructor(private taskLogService: TaskLogService) {}

  createLog(): void {
    if (!this.selectedTask || !this.logDescription || this.timeSpent <= 0) {
      return;
    }

    this.taskLogService.createTaskLog(
      this.selectedTask, // taskId
      {
        description: this.logDescription,
        timeSpent: this.timeSpent,
        date: this.logDate
      }
    ).subscribe({
      next: (log) => {
        this.logs = [...this.logs, log];
        this.resetForm();
      },
      error: (err) => console.error('Error creating log:', err)
    });
  }


  deleteLog(logId: string): void {
    this.taskLogService.deleteTaskLog(logId).subscribe({
      next: () => {
        this.logs = this.logs.filter(log => log.id !== logId);
      },
      error: (err) => console.error('Error deleting log:', err)
    });
  }

  private resetForm(): void {
    this.selectedTask = '';
    this.logDescription = '';
    this.timeSpent = 0;
    this.logDate = new Date();
  }
}
