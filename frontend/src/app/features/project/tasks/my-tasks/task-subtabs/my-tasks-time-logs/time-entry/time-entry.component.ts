import {Component, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {TimeLogService} from '../../../../../../../services/my-tasks/time-log.service';

@Component({
  selector: 'app-time-entry',
  imports: [],
  templateUrl: './time-entry.component.html',
  styleUrl: './time-entry.component.css'
})
export class TimeEntryComponent implements OnDestroy {
  @Input() projectId: string | null = null;
  @Input() userId: string | null = null;
  @Input() incompleteTasks: any[] = [];
  @Input() tasksLoading = false;

  @Output() timeLogCreated = new EventEmitter<void>();

  isRunning = false;
  elapsedTime = 0;
  timerInterval: any;
  errorMessage: string | null = null;
  manualTimeError: string | null = null;

  selectedTaskId: string | null = null;
  manualStartTime: string = '';
  manualEndTime: string = '';
  manualDescription: string = '';

  constructor(private timeLogService: TimeLogService) {}

  ngOnDestroy(): void {
    this.stopTimer();
  }

  startTimer(): void {
    if (!this.isRunning && this.projectId) {
      const startTime = new Date();
      this.isRunning = true;
      this.timerInterval = setInterval(() => {
        this.elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      }, 1000);

      this.timeLogService.startProjectTimer(
        this.projectId,
        this.manualDescription,
        this.selectedTaskId || undefined
      ).subscribe({
        next: () => console.log('Project timer started'),
        error: (error) => {
          console.error('Error starting project timer:', error);
          this.errorMessage = error.message || 'Failed to start timer';
          this.isRunning = false;
          clearInterval(this.timerInterval);
          this.elapsedTime = 0;
        }
      });
    }
  }

  stopTimer(): void {
    if (this.isRunning && this.projectId) {
      this.isRunning = false;
      clearInterval(this.timerInterval);

      this.timeLogService.stopProjectTimer(this.projectId).subscribe({
        next: () => {
          console.log('Project timer stopped');
          this.elapsedTime = 0;
          this.timeLogCreated.emit();
        },
        error: (error) => {
          console.error('Error stopping project timer:', error);
          this.errorMessage = 'Failed to stop timer';
          this.isRunning = true;
          const startTime = new Date(new Date().getTime() - this.elapsedTime * 1000);
          this.timerInterval = setInterval(() => {
            this.elapsedTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
          }, 1000);
        }
      });
    }
  }

  createManualTimeLog(): void {
    if (!this.manualStartTime || !this.manualEndTime) {
      this.manualTimeError = 'Start time and end time are required';
      return;
    }

    const startTime = this.formatForBackend(this.manualStartTime);
    const endTime = this.formatForBackend(this.manualEndTime);

    if (new Date(startTime) >= new Date(endTime)) {
      this.manualTimeError = 'End time must be after start time';
      return;
    }

    if (!this.projectId) {
      this.manualTimeError = 'Project ID is missing';
      return;
    }

    this.timeLogService.createManualProjectTimeLog(
      this.projectId,
      startTime,
      endTime,
      this.manualDescription,
      this.selectedTaskId || undefined
    ).subscribe({
      next: () => {
        console.log('Manual project time log created');
        this.manualTimeError = null;
        this.manualStartTime = '';
        this.manualEndTime = '';
        this.manualDescription = '';
        this.selectedTaskId = null;
        this.timeLogCreated.emit();
      },
      error: (error) => {
        console.error('Error creating manual project time log:', error);
        this.manualTimeError = 'Failed to create manual time log';
      }
    });
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private formatForBackend(datetime: string): string {
    if (datetime.length === 16) {
      return `${datetime}:00.000`;
    }
    return datetime;
  }
}
