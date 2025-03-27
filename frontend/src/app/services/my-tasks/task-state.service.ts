import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskStateService {
  private selectedTaskId = new BehaviorSubject<string | null>(null);
  selectedTaskId$ = this.selectedTaskId.asObservable();

  setSelectedTaskId(taskId: string): void {
    this.selectedTaskId.next(taskId);
  }

  clearSelectedTaskId(): void {
    this.selectedTaskId.next(null);
  }
}
