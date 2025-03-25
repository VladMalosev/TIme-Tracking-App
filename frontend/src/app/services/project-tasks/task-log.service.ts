import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskLogService {
  private taskSource = new BehaviorSubject<any>(null);
  private logsSource = new BehaviorSubject<any[]>([]);

  currentTask = this.taskSource.asObservable();
  currentLogs = this.logsSource.asObservable();

  setTask(task: any) {
    this.taskSource.next(task);
  }

  setLogs(logs: any[]) {
    this.logsSource.next(logs);
  }
}
