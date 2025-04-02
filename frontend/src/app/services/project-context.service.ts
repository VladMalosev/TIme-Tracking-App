import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectContextService {
  private currentProjectIdSubject = new BehaviorSubject<string | null>(null);
  currentProjectId$ = this.currentProjectIdSubject.asObservable();

  private initialized = false;

  initialize(projectId: string): void {
    if (!this.initialized) {
      console.log('Initializing project context with ID:', projectId);
      this.currentProjectIdSubject.next(projectId);
      this.initialized = true;
    }
  }

  setCurrentProjectId(projectId: string): void {
    console.log('Setting project ID:', projectId);
    this.currentProjectIdSubject.next(projectId);
  }

  getCurrentProjectId(): string | null {
    return this.currentProjectIdSubject.value;
  }

  clearCurrentProjectId(): void {
    this.currentProjectIdSubject.next(null);
    this.initialized = false;
  }
}
