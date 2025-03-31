import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectContextService {
  private currentProjectIdSubject = new BehaviorSubject<string | null>(null);
  currentProjectId$ = this.currentProjectIdSubject.asObservable();

  setCurrentProjectId(projectId: string): void {
    console.log('Setting project ID:', projectId);
    this.currentProjectIdSubject.next(projectId);
  }

  getCurrentProjectId(): string | null {
    return this.currentProjectIdSubject.value;
  }

  clearCurrentProjectId(): void {
    this.currentProjectIdSubject.next(null);
  }
}
