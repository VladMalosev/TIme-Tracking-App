import { Component, OnInit } from '@angular/core';
import { NgFor, NgClass } from "@angular/common";
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { animate, style, transition, trigger } from '@angular/animations';

interface TeamMember {
  id: number;
  name: string;
  position: string;
  bio: string;
  image: string;
  socialLinks: SocialLink[];
}

interface SocialLink {
  icon: string;
  name: string;
  url: string;
}

@Component({
  selector: 'app-team-members',
  standalone: true,
  imports: [
    NgFor,
    MatIconModule
  ],
  templateUrl: './team-members.component.html',
  styleUrls: ['./team-members.component.scss'],
})

export class TeamMembersComponent implements OnInit {
  teamMembers: TeamMember[] = [
    {
      id: 1,
      name: "Alex Johnson",
      position: "CEO & Founder",
      bio: "Visionary leader with 10+ years of experience in project management solutions.",
      image: "assets/images/team/man.png",
      socialLinks: [
        { icon: "facebook", name: "Facebook", url: "https://facebook.com" },
        { icon: "code", name: "Portfolio", url: "https://portfolio.dev" },
        { icon: "linkedin", name: "LinkedIn", url: "https://linkedin.com" },
        { icon: "email", name: "Email", url: "mailto:alex@example.com" }
      ]
    },
    {
      id: 2,
      name: "John Doe",
      position: "Lead Developer",
      bio: "Full-stack developer passionate about creating intuitive user experiences.",
      image: "assets/images/team/man1.png",
      socialLinks: [
        { icon: "facebook", name: "Facebook", url: "https://facebook.com" },
        { icon: "code", name: "Portfolio", url: "https://github.com" },
        { icon: "linkedin", name: "LinkedIn", url: "https://linkedin.com" },
        { icon: "email", name: "Email", url: "mailto:sarah@example.com" }
      ]
    },
    {
      id: 3,
      name: "Michael Chen",
      position: "Product Manager",
      bio: "Ensures our product meets customer needs and delivers real value.",
      image: "assets/images/team/man2.png",
      socialLinks: [
        { icon: "facebook", name: "Facebook", url: "https://facebook.com" },
        { icon: "code", name: "Portfolio", url: "https://github.com" },
        { icon: "linkedin", name: "LinkedIn", url: "https://linkedin.com" },
        { icon: "email", name: "Email", url: "mailto:michael@example.com" }
      ]
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
  }

  navigateToMemberDetail(memberId: number): void {
    this.router.navigate(['/team', memberId]);
  }
}
