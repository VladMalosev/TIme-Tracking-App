import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QuickActionsService {
  showTasks$ = new Subject<void>();
  logProjectTime$ = new Subject<void>();
  viewReports$ = new Subject<void>();

  triggerShowTasks() {
    this.showTasks$.next();
  }

  triggerLogProjectTime() {
    this.logProjectTime$.next();
  }

  triggerViewReports() {
    this.viewReports$.next();
  }
}
