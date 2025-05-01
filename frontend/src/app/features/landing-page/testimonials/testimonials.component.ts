import { Component, OnInit } from '@angular/core';
import { NgForOf } from "@angular/common";
import { MatIcon } from '@angular/material/icon';

interface Testimonial {
  quote: string;
  author: string;
}

@Component({
  selector: 'app-testimonials',
  imports: [
    MatIcon,
    NgForOf
  ],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss',
  standalone: true
})
export class TestimonialsComponent implements OnInit {
  testimonials: Testimonial[] = [
    {
      quote: "This platform transformed how we manage our projects! The interface is so intuitive that our entire team was up and running in just a day.",
      author: "Jane Doe, CEO at TechCorp"
    },
    {
      quote: "The time tracking features saved us hundreds of hours of administrative work.",
      author: "John Smith, Project Manager"
    },
    {
      quote: "I've tried many project management tools, but this one stands out for its simplicity and power.",
      author: "Alex Johnson, Tech Lead"
    },
    {
      quote: "Customer support is phenomenal. They helped us customize the platform to our specific needs.",
      author: "Maria Garcia, Operations Director"
    },
    {
      quote: "The analytics dashboard gives us insights we never had access to before. Game changer!",
      author: "Robert Chen, Data Analyst"
    },
    {
      quote: "We've cut meeting time by 30% since implementing this tool. The collaborative features are outstanding.",
      author: "Sarah Williams, Team Lead"
    },
    {
      quote: "The mobile app means I can stay updated even when I'm on the go. Perfect for my busy schedule.",
      author: "Michael Brown, Executive"
    },
    {
      quote: "Integration with our existing tools was seamless. The development team clearly thought of everything.",
      author: "Lisa Taylor, IT Manager"
    },
    {
      quote: "We've been able to take on 40% more clients since adopting this platform, without adding staff.",
      author: "David Miller, Agency Owner"
    },
    {
      quote: "The automated reporting saved my team countless hours each month.",
      author: "Jennifer Wilson, Department Head"
    },
    {
      quote: "From day one, this tool has exceeded our expectations. Worth every penny.",
      author: "Thomas Moore, Small Business Owner"
    },
    {
      quote: "As a freelancer, I needed something simple yet powerful. This hits the sweet spot perfectly.",
      author: "Olivia Martinez, Independent Consultant"
    },
    {
      quote: "The calendar integration changed how we schedule our projects. Everything syncs perfectly!",
      author: "Kevin Anderson, Project Coordinator"
    },
    {
      quote: "I was skeptical at first, but after just one week, I couldn't imagine working without it.",
      author: "Rachel Kim, Marketing Manager"
    },
    {
      quote: "Our clients love the transparency this tool provides. They can see progress in real-time.",
      author: "Daniel Lopez, Client Relations"
    },
    {
      quote: "The dashboard is so intuitive, I was able to get my entire team onboarded in one session.",
      author: "Emma Wilson, Team Director"
    },
    {
      quote: "We've reduced our project completion time by 25% since implementing this solution.",
      author: "Brandon Taylor, Operations Manager"
    },
    {
      quote: "The customizable reports have made our monthly meetings so much more productive.",
      author: "Sophia Chen, Executive Assistant"
    }
  ];

  testimonialRows: Testimonial[][] = [[], [], []];

  ngOnInit(): void {
    this.testimonialRows = [
      this.testimonials.slice(0, 7),
      this.testimonials.slice(7, 13),
      this.testimonials.slice(13)
    ];
  }
}
