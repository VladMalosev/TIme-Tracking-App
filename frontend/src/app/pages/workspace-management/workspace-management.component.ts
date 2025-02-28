import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-workspace-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './workspace-management.component.html',
  styleUrls: ['./workspace-management.component.css']
})
export class WorkspaceManagementComponent implements OnInit {
  workspaces: any[] = [];
  workspaceDetails: any = null;
  newWorkspace = { name: '', description: '' };
  newUser = { workspaceId: '', email: '', role: 'USER' };
  errorMessage: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchWorkspaces();
  }

  fetchWorkspaces(): void {
    this.http.get<any[]>('http://localhost:8080/api/workspaces', { withCredentials: true })
      .subscribe(
        (response) => {
          console.log('Fetched workspaces:', response);
          this.workspaces = response.map(ws => ({
            id: ws.workspace.id,
            name: ws.workspace.name,
            description: ws.workspace.description,
            role: ws.role
          }));
          this.errorMessage = null;
        },
        (error) => {
          console.error('Error fetching workspaces', error);
          this.errorMessage = 'Failed to fetch workspaces. Please try again.';
        }
      );
  }



  createWorkspace(): void {
    this.http.post<any>('http://localhost:8080/api/workspaces', this.newWorkspace, { withCredentials: true })
      .subscribe(
        (response) => {
          this.workspaces.push(response);
          this.newWorkspace = { name: '', description: '' };
          this.errorMessage = null;
        },
        (error) => {
          console.error('Error creating workspace', error);
          this.errorMessage = 'Failed to create workspace. Please try again.';
        }
      );
  }

  getWorkspaceDetails(workspaceId: string): void {
    this.http.get<any>(`http://localhost:8080/api/workspaces/${workspaceId}`, { withCredentials: true })
      .subscribe(
        (response) => {
          this.workspaceDetails = response;
          this.errorMessage = null;
        },
        (error) => {
          console.error('Error fetching workspace details', error);
          this.errorMessage = 'Failed to fetch workspace details. Please try again.';
        }
      );
  }

  addUserToWorkspace(): void {
    if (!this.workspaceDetails) {
      this.errorMessage = 'No workspace selected.';
      return;
    }

    this.newUser.workspaceId = this.workspaceDetails.workspace.id;

    this.http.post<any>(
      `http://localhost:8080/api/workspaces/${this.newUser.workspaceId}/users`,
      null,
      {
        params: {
          email: this.newUser.email,
          role: this.newUser.role
        },
        withCredentials: true
      }
    ).subscribe(
      (response) => {
        this.workspaceDetails.users.push(response);
        this.newUser = { workspaceId: '', email: '', role: 'USER' };
        this.errorMessage = null;
      },
      (error) => {
        console.error('Error adding user to workspace', error);
        this.errorMessage = 'Failed to add user to workspace. Please try again.';
      }
    );
  }


  deleteWorkspace(workspaceId: string): void {
    if (confirm('Are you sure you want to delete this workspace?')) {
      this.http.delete(`http://localhost:8080/api/workspaces/${workspaceId}`, { withCredentials: true })
        .subscribe(
          () => {
            this.workspaces = this.workspaces.filter(ws => ws.id !== workspaceId);
            this.workspaceDetails = null;
            this.errorMessage = null;
          },
          (error) => {
            console.error('Error deleting workspace', error);
            this.errorMessage = 'Failed to delete workspace. Only the workspace ADMIN can delete it.';
          }
        );
    }
  }
}
