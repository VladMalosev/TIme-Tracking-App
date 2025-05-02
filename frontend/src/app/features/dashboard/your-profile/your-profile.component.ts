import { Component } from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-your-profile',
  templateUrl: './your-profile.component.html',
  imports: [
    MatIconButton,
    MatIcon,
    NgForOf
  ],
  styleUrls: ['./your-profile.component.css']
})
export class YourProfileComponent {
  userData = {
    name: "Prashant",
    profileImage: "/api/placeholder/100/100",
    activities: [
      { id: 1, project: "Sweatbank Dev", timeRange: "08:00 - 10:00", status: "Done" },
      { id: 2, project: "Sweatbank Dev", timeRange: "10:30 - 12:00", status: "Done" },
      { id: 3, project: "Sweatbank Dev", timeRange: "13:00 - 15:00", status: "Done" },
      { id: 4, project: "Sweatbank Dev", timeRange: "15:30 - 17:00", status: "Done" },
      { id: 5, project: "Sweatbank Dev", timeRange: "08:00 - 17:00", status: "Done" }
    ]
  };

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }
}
