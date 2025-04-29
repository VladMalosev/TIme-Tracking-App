import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  imports: [
    MatIcon
  ],
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent {
  features = [
    {
      icon: 'schedule',
      title: 'Time Tracking',
      description: 'Accurately track time spent on projects and tasks'
    },
    {
      icon: 'groups',
      title: 'Team Collaboration',
      description: 'Work seamlessly with your team in real-time'
    },
    {
      icon: 'assessment',
      title: 'Detailed Reports',
      description: 'Generate comprehensive reports for better insights'
    },
    {
      icon: 'folder',
      title: 'Project Management',
      description: 'Organize and manage all your projects in one place'
    }
  ];

  testimonials = [
    {
      quote: "This platform transformed how we manage our projects!",
      author: "Jane Doe, CEO at TechCorp"
    },
    {
      quote: "The time tracking features saved us hundreds of hours.",
      author: "John Smith, Project Manager"
    }
  ];

  constructor(private router: Router) {}

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}
