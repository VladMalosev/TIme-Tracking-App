import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NgFor, NgIf } from '@angular/common';
import { FeaturesComponent } from './features/features.component';
import { HowItWorksComponent } from './how-it-works/how-it-works.component';
import { TeamMembersComponent } from './team-members/team-members.component';
import { TestimonialsComponent } from './testimonials/testimonials.component';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    NgFor,
    NgIf,
    FeaturesComponent,
    HowItWorksComponent,
    TeamMembersComponent,
    TestimonialsComponent
  ]
})
export class LandingPageComponent {
  constructor(
    private router: Router,
    private dialog: MatDialog
  ) {}

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
