import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TimeLogFilterService {
  private filteredLogsSubject = new BehaviorSubject<any[]>([]);
  filteredLogs$ = this.filteredLogsSubject.asObservable();

  private filtersResetSubject = new Subject<void>();
  onFiltersReset$ = this.filtersResetSubject.asObservable();

  updateFilteredLogs(logs: any[]) {
    this.filteredLogsSubject.next(logs);
  }

  notifyFiltersReset() {
    this.filtersResetSubject.next();
  }
}
