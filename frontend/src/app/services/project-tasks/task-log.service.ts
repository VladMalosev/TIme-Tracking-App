import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskLogService {
  private taskSubject = new BehaviorSubject<any>(null);
  private logsSubject = new BehaviorSubject<any[]>([]);

  task$ = this.taskSubject.asObservable();
  logs$ = this.logsSubject.asObservable();

  setTask(task: any): void {
    this.taskSubject.next(task);
  }

  setLogs(logs: any[]): void {
    this.logsSubject.next(logs);
  }

  clear(): void {
    this.taskSubject.next(null);
    this.logsSubject.next([]);
  }
}
