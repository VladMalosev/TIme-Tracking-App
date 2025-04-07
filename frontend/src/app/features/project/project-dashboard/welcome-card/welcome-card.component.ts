import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { ProjectContextService } from "../../../../services/project-context.service";
import { WelcomeCardService } from "../../../../services/dashboard/welcome-card.service";
import { AuthService } from "../../../../core/auth/auth.service";
import {CommonModule, DatePipe} from '@angular/common';

@Component({
  selector: 'app-welcome-card',
  templateUrl: './welcome-card.component.html',
  imports: [MatIcon, DatePipe, CommonModule],
  styleUrls: ['./welcome-card.component.scss']
})
export class WelcomeCardComponent implements OnInit, OnDestroy {
  projectName: string = '';
  projectDeadline: string = '';
  projectDescription: string = '';
  totalHoursLogged: number = 0;
  totalMembers: number = 0;
  isLoading: boolean = true;
  userId: string | null = null;

  private subscriptions = new Subscription();

  constructor(
    private welcomeCardService: WelcomeCardService,
    private projectContextService: ProjectContextService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const projectId = this.projectContextService.getCurrentProjectId();

    this.subscriptions.add(
      this.authService.userId$.subscribe(userId => {
        this.userId = userId;
        if (projectId && this.userId) {
          this.loadData(projectId, this.userId);
        }
      })
    );

    this.subscriptions.add(
      this.welcomeCardService.projectName$.subscribe(name => {
        this.projectName = name;
      })
    );

    this.subscriptions.add(
      this.welcomeCardService.projectDeadline$.subscribe(deadline => {
        this.projectDeadline = deadline;
      })
    );

    this.subscriptions.add(
      this.welcomeCardService.projectDescription$.subscribe(description => {
        this.projectDescription = description;
      })
    );

    this.subscriptions.add(
      this.welcomeCardService.totalMembers$.subscribe(count => {
        this.totalMembers = count;
      })
    );

    this.subscriptions.add(
      this.welcomeCardService.totalHoursLogged$.subscribe(hours => {
        this.totalHoursLogged = hours;
        this.isLoading = false;
      })
    );
  }

  private loadData(projectId: string, userId: string): void {
    this.isLoading = true;

    this.welcomeCardService.fetchProjectDetails(projectId).subscribe({
      error: (err) => {
        console.error('Failed to load project details', err);
        this.isLoading = false;
      }
    });

    this.welcomeCardService.fetchProjectData(projectId).subscribe({
      error: (err) => {
        console.error('Failed to load project stats', err);
        this.isLoading = false;
      }
    });

    this.welcomeCardService.fetchTotalHoursLogged(projectId, userId).subscribe({
      error: (err) => {
        console.error('Failed to load time logs', err);
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get projectInitial(): string {
    return this.projectName?.charAt(0)?.toUpperCase() || '';
  }

  logTime(): void {
  }

  viewReports(): void {
  }
}
