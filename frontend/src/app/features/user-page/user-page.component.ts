import {Component, NgModule, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {ActivatedRoute} from '@angular/router';
import {CommonModule} from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {PhotoUploadService} from '../../services/user-profile/photo-upload.service';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  location?: string;
  timezone?: string;
  photoUrl?: string;
  tagline?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-user-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatSelectModule
  ],
  templateUrl: './user-page.component.html',
  styleUrl: './user-page.component.scss'
})
export class UserPageComponent implements OnInit {
  user: User = {
    id: '',
    name: '',
    email: ''
  };

  timezones = [
    'UTC-12:00',
    'UTC-11:00',
    'UTC-10:00',
    'UTC-09:00',
    'UTC-08:00',
    'UTC-07:00',
    'UTC-06:00',
    'UTC-05:00',
    'UTC-04:00',
    'UTC-03:00',
    'UTC-02:00',
    'UTC-01:00',
    'UTC±00:00',
    'UTC+01:00',
    'UTC+02:00',
    'UTC+03:00',
    'UTC+04:00',
    'UTC+05:00',
    'UTC+06:00',
    'UTC+07:00',
    'UTC+08:00',
    'UTC+09:00',
    'UTC+10:00',
    'UTC+11:00',
    'UTC+12:00',
    'UTC+13:00',
    'UTC+14:00'
  ];

  profileForm!: FormGroup;
  isOwner = false;
  isEditing = false;
  isLoading = true;
  selectedFile: File | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private photoUploadService: PhotoUploadService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
  }

  initializeForm(): void {
    this.profileForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.pattern('^[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4,6}$')],
      gender: [''],
      location: [''],
      timezone: [''],
      tagline: [''],
      bio: ['']
    });
  }

  loadUserData(): void {
    const userId = this.route.snapshot.paramMap.get('id');

    this.http.get<User>(`${environment.apiBaseUrl}/users/${userId}`)
      .subscribe({
        next: (user) => {
          this.user = user;
          this.isOwner = true;
          this.updateFormValues();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load user data:', err);
          this.isLoading = false;
        }
      });
  }

  updateFormValues(): void {
    this.profileForm.patchValue({
      name: this.user.name,
      email: this.user.email,
      phone: this.user.phone || '',
      gender: this.user.gender || '',
      location: this.user.location || '',
      timezone: this.user.timezone || '',
      tagline: this.user.tagline || '',
      bio: this.user.bio || ''
    });

    this.profileForm.markAsPristine();
  }

  toggleEditMode(): void {
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.updateFormValues();
    if (this.selectedFile) {
      this.selectedFile = null;
    }
  }

  onPhotoSelected(event: Event): void {
/*    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      this.photoUploadService.uploadPhoto(this.user.id, file)
        .subscribe({
          next: (response) => {
            this.user.photoUrl = response.photoUrl;
            this.profileForm.patchValue({ photoUrl: response.photoUrl });
            this.profileForm.markAsDirty();
          },
          error: (err) => {
            this.snackBar.open('Failed to upload photo', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            console.error('Photo upload error:', err);
          }
        });
    }*/
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      const updatedProfile = {
        ...this.profileForm.value
      };

      this.http.put<User>(`${environment.apiBaseUrl}/users/${this.user.id}/profile`, updatedProfile)
        .subscribe({
          next: (updatedUser) => {
            this.user = updatedUser;
            this.profileForm.markAsPristine();
            this.isEditing = false;

            this.snackBar.open('Profile updated successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          },
          error: (err) => {
            this.snackBar.open('Failed to update profile', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            console.error('Profile update error:', err);
          }
        });
    }
  }
}
