import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportStateService {
  private reportDataSubject = new BehaviorSubject<any>(null);
  private filterSubject = new BehaviorSubject<any>(null);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  reportData$ = this.reportDataSubject.asObservable();
  filter$ = this.filterSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();

  setReportData(data: any): void {
    this.reportDataSubject.next(data);
  }

  setFilter(filter: any): void {
    this.filterSubject.next(filter);
  }

  setIsLoading(isLoading: boolean): void {
    this.isLoadingSubject.next(isLoading);
  }

}
