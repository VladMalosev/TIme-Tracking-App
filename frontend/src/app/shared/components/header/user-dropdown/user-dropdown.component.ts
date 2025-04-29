import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';

interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports: [
    RouterLink,
    CommonModule
  ],
  styleUrls: ['./user-dropdown.component.scss']
})
export class UserDropdownComponent implements OnInit {
  isDropdownOpen = false;
  avatarUrl = 'assets/icons/avatar.png';
  userId: string | null = null;
  user: User | null = null;

  @ViewChild('dropdownMenu', { static: false }) dropdownMenu!: ElementRef;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.userService.userId$.subscribe(userId => {
      this.userId = userId;
      if (userId) {
        this.loadUserData(userId);
      }
    });
  }

  loadUserData(userId: string): void {
    this.http.get<User>(`${environment.apiBaseUrl}/users/${userId}`, { withCredentials: true })
      .subscribe({
        next: (userData) => {
          this.user = userData;
          this.updateAvatarUrl();
        },
        error: (err) => {
          console.error('Failed to load user data:', err);
        }
      });
  }

  updateAvatarUrl(): void {
    if (this.user?.photoUrl) {
      this.avatarUrl = this.getPhotoUrl(this.user.photoUrl);
    } else {
      this.avatarUrl = 'assets/icons/avatar.png';
    }
  }

  getPhotoUrl(url: string | undefined): string {
    if (!url) {
      return 'assets/icons/avatar.png';
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const cleanPath = url.startsWith('/') ? url.substring(1) : url;
    return `${environment.apiBaseUrl.replace(/\/api$/, '')}/${cleanPath}`;
  }

  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout(): void {
    this.authService.logout().subscribe(
      () => {
        this.isDropdownOpen = false;
        this.router.navigate(['/login']);
      },
      (error) => {
        console.error('Error during logout:', error);
      }
    );
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.dropdownMenu && !this.dropdownMenu.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }
}
