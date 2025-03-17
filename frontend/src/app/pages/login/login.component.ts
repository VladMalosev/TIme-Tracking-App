import { Component } from '@angular/core';
import {AuthService} from '../../auth.service';
import {Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HttpClient, provideHttpClient} from '@angular/common/http';
import {HeaderComponent} from "../header/header.component";

@Component({
  selector: 'app-login',
    imports: [CommonModule, FormsModule, HeaderComponent,],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  credentials = {
    email: '',
    password: '',
  };

  errorMessage = '';

  constructor(private authService: AuthService, private router: Router, private http: HttpClient) {}


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

  loginWithGoogle() {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

}
