import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskSelectionService {
  private selectedTaskIdSubject = new BehaviorSubject<string | null>(null);
  selectedTaskId$ = this.selectedTaskIdSubject.asObservable();
  private refreshTimeLogsSubject = new BehaviorSubject<void>(undefined);
  refreshTimeLogs$ = this.refreshTimeLogsSubject.asObservable();

  setSelectedTaskId(taskId: string): void {
    this.selectedTaskIdSubject.next(taskId);
  }

  clearSelectedTaskId(): void {
    this.selectedTaskIdSubject.next(null);
  }

  getCurrentTaskId(): string | null {
    return this.selectedTaskIdSubject.value;
  }

  triggerTimeLogsRefresh(): void {
    this.refreshTimeLogsSubject.next();
  }
}
