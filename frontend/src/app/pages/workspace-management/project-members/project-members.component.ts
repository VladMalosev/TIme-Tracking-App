import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { tap } from 'rxjs/operators';
import { interval, Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-members',
  imports: [CommonModule, FormsModule],
  templateUrl: './project-members.component.html',
  styleUrls: ['./project-members.component.css']
})
export class ProjectMembersComponent implements OnInit, OnDestroy {
  projectId: string | null = null;
  members: any[] = [];
  errorMessage: string | null = null;
  onlineUsers: string[] = [];
  private onlineStatusSubscription: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    if (this.projectId) {
      this.fetchProjectMembers(this.projectId);
      this.getOnlineUsers();
      this.startOnlineStatusPolling();
    }
  }

  ngOnDestroy(): void {
    if (this.onlineStatusSubscription) {
      this.onlineStatusSubscription.unsubscribe();
    }
  }

  startOnlineStatusPolling(): void {
    this.onlineStatusSubscription = interval(50000).subscribe(() => {
      this.getOnlineUsers();
    });
  }

  getOnlineUsers(): void {
    this.http.get<string[]>('http://localhost:8080/api/auth/online-users', { withCredentials: true }).pipe(
      tap(users => {
        console.log('Fetched online users:', users);
        this.onlineUsers = users;
        this.updateMembersStatus();
      })
    ).subscribe();
  }

  fetchProjectMembers(projectId: string): void {
    this.http.get<any[]>(`http://localhost:8080/api/projects/${projectId}/collaborators`, { withCredentials: true })
      .subscribe(
        (response) => {
          console.log('Project members:', response);
          this.members = response.map(member => ({
            ...member,
            status: this.onlineUsers.includes(member.user.email) ? 'Online' : 'Offline'
          }));
          this.errorMessage = null;
        },
        (error) => {
          console.error('Error fetching project members', error);
          this.errorMessage = 'Failed to fetch project members. Please try again.';
        }
      );
  }

  updateMembersStatus(): void {
    this.members = this.members.map(member => ({
      ...member,
      status: this.onlineUsers.includes(member.user.email) ? 'Online' : 'Offline'
    }));
  }

  removeMember(memberId: string): void {
    if (confirm('Are you sure you want to remove this member?')) {
      this.http.delete(`http://localhost:8080/api/projects/${this.projectId}/collaborators/${memberId}`, { withCredentials: true })
        .subscribe(
          () => {
            this.members = this.members.filter(member => member.id !== memberId);
          },
          (error) => {
            console.error('Error removing member', error);
            this.errorMessage = 'Failed to remove member. Please try again.';
          }
        );
    }
  }
}
