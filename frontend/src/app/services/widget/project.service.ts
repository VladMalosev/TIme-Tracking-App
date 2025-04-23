import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface Project {
  id: string;
  name: string;
  description: string;
  status?: string;
  createdAt: string;
  deadline?: Date | null;
  workspaceId: string;
  selected?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Fetch all projects where user is a member (both owned and collaborated)
  getAllUserProjects(): Observable<{ owned: Project[]; collaborated: Project[] }> {
    return forkJoin({
      owned: this.getOwnedProjects(),
      collaborated: this.getCollaboratedProjects()
    });
  }

  // Fetch projects owned by the user (from their workspace)
  getOwnedProjects(): Observable<Project[]> {
    return this.http.get<{ projects: Project[] }>(
      `${this.apiUrl}/projects`,
      { withCredentials: true }
    ).pipe(
      map(response => response.projects)
    );
  }

  // Fetch projects where user is a collaborator
  getCollaboratedProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(
      `${this.apiUrl}/projects/collaborated`,
      { withCredentials: true }
    );
  }

  // Fetch projects for a specific workspace
  getWorkspaceProjects(workspaceId: string): Observable<Project[]> {
    return this.http.get<Project[]>(
      `${this.apiUrl}/workspaces/${workspaceId}/projects`,
      { withCredentials: true }
    );
  }
}
