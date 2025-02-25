import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  userName!: string;
  userEmail!: string;

  constructor(private http: HttpClient) {
  }

  ngOnInit(): void {
    this.http.get<any>('http://localhost:8080/api/auth/dashboard', { withCredentials: true }).subscribe(
      (response) => {
        this.userName = response.name;
        this.userEmail = response.email;
      },
      (error) => {
        console.error('Error fetching dashboard data', error);
      }

    );

  }

}
