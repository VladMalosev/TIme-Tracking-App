// task-tabs.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskTabsService {
  private activeTabSubject = new BehaviorSubject<string>('my-tasks');
  private showInviteFormSubject = new BehaviorSubject<boolean>(false);
  private canAssignTasksSubject = new BehaviorSubject<boolean>(false);
  private nestedActiveTabSubject = new BehaviorSubject<string>('assigned-tasks');

  nestedActiveTab$ = this.nestedActiveTabSubject.asObservable();
  activeTab$ = this.activeTabSubject.asObservable();
  canAssignTasks$ = this.canAssignTasksSubject.asObservable();

  setActiveTab(tab: string): void {
    this.activeTabSubject.next(tab);
  }

  setCanAssignTasks(canAssign: boolean): void {
    this.canAssignTasksSubject.next(canAssign);
  }

  getCurrentCanAssignTasks(): boolean {
    return this.canAssignTasksSubject.value;
  }

  toggleInviteForm(): void {
    this.showInviteFormSubject.next(!this.showInviteFormSubject.value);
  }

  setNestedActiveTab(tab: string): void {
    this.nestedActiveTabSubject.next(tab);
  }


  getNestedActiveTab(): string {
    return this.nestedActiveTabSubject.value;
  }
}
