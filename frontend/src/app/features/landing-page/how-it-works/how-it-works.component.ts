import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { animate, style, transition, trigger, stagger, query } from '@angular/animations';

interface Step {
  icon: string;
  title: string;
  description: string;
  features?: string[];
  action?: {
    text: string;
    url: string;
  };
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatIconModule
  ],
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.scss'],
})
export class HowItWorksComponent implements OnInit {
  steps: Step[] = [
    {
      icon: 'person_add',
      title: 'Create Your Account',
      description: 'Get started in seconds with our seamless signup process. No credit card required.',
      features: [
        'Free 14-day trial',
        'No credit card required',
        'Instant account activation'
      ],
      action: {
        text: 'Sign up now',
        url: '/register'
      }
    },
    {
      icon: 'add_task',
      title: 'Add Your Projects',
      description: 'Create projects and organize your work with our intuitive project management system.',
      features: [
        'Unlimited projects',
        'Team collaboration',
        'Custom project templates'
      ],
      action: {
        text: 'Learn about projects',
        url: '/features/projects'
      }
    },
    {
      icon: 'timer',
      title: 'Start Tracking Time',
      description: 'Track time effortlessly across all your projects with our powerful time tracking tools.',
      features: [
        'One-click time tracking',
        'Detailed reporting',
        'Automated timesheet creation'
      ],
      action: {
        text: 'Explore time tracking',
        url: '/features/time-tracking'
      }
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initialize component
    this.setupScrollAnimation();
  }

  navigateToSignup(): void {
    this.router.navigate(['/signup']);
  }

  private setupScrollAnimation(): void {
    if (typeof window !== 'undefined') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animated');
            }
          });
        },
        { threshold: 0.1 }
      );

      setTimeout(() => {
        document.querySelectorAll('.process-step').forEach(step => {
          observer.observe(step);
        });
      }, 100);
    }
  }
}
