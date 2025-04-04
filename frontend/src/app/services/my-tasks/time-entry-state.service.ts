import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimeEntryStateService {
  private projectIdSubject = new BehaviorSubject<string | null>(null);
  private userIdSubject = new BehaviorSubject<string | null>(null);
  private incompleteTasksSubject = new BehaviorSubject<any[]>([]);
  private tasksLoadingSubject = new BehaviorSubject<boolean>(false);
  private timeLogCreatedSubject = new Subject<void>();

  projectId$ = this.projectIdSubject.asObservable();
  userId$ = this.userIdSubject.asObservable();
  incompleteTasks$ = this.incompleteTasksSubject.asObservable();
  tasksLoading$ = this.tasksLoadingSubject.asObservable();
  timeLogCreated$ = this.timeLogCreatedSubject.asObservable();

  setProjectId(projectId: string | null) {
    this.projectIdSubject.next(projectId);
  }

  setUserId(userId: string | null) {
    this.userIdSubject.next(userId);
  }

  setIncompleteTasks(tasks: any[]) {
    this.incompleteTasksSubject.next(tasks);
  }

  setTasksLoading(loading: boolean) {
    this.tasksLoadingSubject.next(loading);
  }

  notifyTimeLogCreated() {
    this.timeLogCreatedSubject.next();
  }
}
