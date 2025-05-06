import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChild('carousel') carouselElement!: ElementRef;

  credentials = {
    email: '',
    password: '',
  };

  errorMessage = '';
  hidePassword = true;
  currentSlide = 0;
  carouselInterval!: Subscription;
  isCarouselPaused = false;

  constructor(private authService: AuthService, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.startCarouselTimer();

    if (this.router.url.includes('?code=') || this.router.url.includes('?token=')) {
      this.router.navigate(['/dashboard']).then(() => {
        window.location.reload();
      });
    }
  }

  ngOnDestroy() {
    this.stopCarouselTimer();
  }

  startCarouselTimer() {
    if (!this.isCarouselPaused) {
      this.carouselInterval = interval(5000).subscribe(() => {
        this.nextSlide();
      });
    }
  }

  stopCarouselTimer() {
    if (this.carouselInterval) {
      this.carouselInterval.unsubscribe();
    }
  }

  pauseCarousel() {
    this.isCarouselPaused = true;
    this.stopCarouselTimer();

    setTimeout(() => {
      this.isCarouselPaused = false;
      this.startCarouselTimer();
    }, 10000);
  }

  login() {
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('JWT Token received:', response);
        this.router.navigate(['/dashboard']).then(() => {
          window.location.reload();
        });
      },
      error: (err) => {
        console.log(err);
        this.errorMessage = err.error.message || 'Login failed';
      }
    });
  }

  loginWithGoogle() {
    localStorage.setItem('preAuthRoute', window.location.pathname);
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  loginWithMicrosoft() {
    localStorage.setItem('preAuthRoute', window.location.pathname);
    window.location.href = 'http://localhost:8080/oauth2/authorization/microsoft';
  }

  loginWithApple() {
    localStorage.setItem('preAuthRoute', window.location.pathname);
    window.location.href = 'http://localhost:8080/oauth2/authorization/apple';
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % 3;
    this.pauseCarousel();
  }

  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + 3) % 3;
    this.pauseCarousel();
  }

  goToSlide(index: number) {
    this.currentSlide = index;
    this.pauseCarousel();
  }
}
