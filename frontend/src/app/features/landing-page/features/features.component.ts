import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NgFor, NgIf } from '@angular/common';
import { animate, style, transition, trigger, stagger, query } from '@angular/animations';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [
    MatIconModule,
    NgFor,
    NgIf
  ],
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss'],
})
export class FeaturesComponent implements OnInit {
  features: Feature[] = [
    {
      icon: 'schedule',
      title: 'Time Tracking',
      description: 'Accurately track time spent on projects and tasks with a single click, ensuring every minute is accounted for.'
    },
    {
      icon: 'groups',
      title: 'Team Collaboration',
      description: 'Work seamlessly with your team in real-time, share updates, and coordinate efforts on multiple projects simultaneously.'
    },
    {
      icon: 'assessment',
      title: 'Detailed Reports',
      description: 'Generate comprehensive reports for better insights into productivity, project progress, and resource allocation.'
    },
    {
      icon: 'folder',
      title: 'Project Management',
      description: 'Organize and manage all your projects in one place with customizable workflows and task prioritization.'
    },
    {
      icon: 'notifications',
      title: 'Smart Reminders',
      description: 'Never miss a deadline with intelligent reminders and notifications that keep your projects on track.'
    },
  ];

  constructor() {}

  ngOnInit(): void {
    this.setupScrollAnimation();
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
        document.querySelectorAll('.feature-card').forEach(card => {
          observer.observe(card);
        });
      }, 100);
    }
  }
}
