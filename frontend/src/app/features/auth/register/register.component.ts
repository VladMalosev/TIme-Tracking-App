import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage = '';
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern('')]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      return null;
    }
  }

  register(): void {
    if (this.registerForm.invalid) {
      return;
    }

    const userData = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      phone: this.registerForm.value.phone || null
    };

    this.authService.register(userData).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => (this.errorMessage = err.error.message || 'Registration failed'),
    });
  }

  passwordHasUpperCase(): boolean {
    const password = this.registerForm.get('password')?.value;
    return password && /[A-Z]/.test(password);
  }

  passwordHasLowerCase(): boolean {
    const password = this.registerForm.get('password')?.value;
    return password && /[a-z]/.test(password);
  }

  passwordHasNumber(): boolean {
    const password = this.registerForm.get('password')?.value;
    return password && /[0-9]/.test(password);
  }

  passwordHasSpecialChar(): boolean {
    const password = this.registerForm.get('password')?.value;
    return password && /[!@#$%^&*(),.?":{}|<>]/.test(password);
  }

  loginWithGoogle() {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  }

  loginWithMicrosoft() {
    window.location.href = 'http://localhost:8080/oauth2/authorization/microsoft';
  }

  loginWithApple() {
    window.location.href = 'http://localhost:8080/oauth2/authorization/apple';
  }
}
