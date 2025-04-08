import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectContextService } from '../../../../services/project-context.service'; // adjust path if needed
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-quick-actions',
  templateUrl: './quick-actions.component.html',
  imports: [MatIcon, MatButton],
  styleUrls: ['./quick-actions.component.scss']
})
export class QuickActionsComponent {
  constructor(
    private router: Router,
    private projectContextService: ProjectContextService
  ) {}

  navigateToMyTasks(): void {
    const projectId = this.projectContextService.getCurrentProjectId();
    if (projectId) {
      this.router.navigate([`/project-details/${projectId}/dashboard`], {
        queryParams: { tab: 'tasks', subTab: 'assigned-tasks' }
      });
    }
  }

  navigateToLogTime(): void {
    const projectId = this.projectContextService.getCurrentProjectId();
    if (projectId) {
      this.router.navigate([`/project-details/${projectId}/dashboard`], {
        queryParams: { tab: 'tasks', subTab: 'time-logs' }
      });
    }
  }

  navigateToAnalytics(): void {
    const projectId = this.projectContextService.getCurrentProjectId();
    if (projectId) {
      this.router.navigate([`/project-details/${projectId}/dashboard`], {
        queryParams: { tab: 'tasks', subTab: 'statistics' }
      });
    }
  }
}
