import { Component } from '@angular/core';
import {AuthService} from '../../auth.service';
import {Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {provideHttpClient} from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  credentials = {
    email: '',
    password: '',
  };

  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}


  login() {
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        // Assuming response contains the token
        console.log('JWT Token received:', response);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.log(err);  // Log error to debug
        this.errorMessage = err.error.message || 'Login failed';
      }
    });
  }

}
