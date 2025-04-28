import { Component, ElementRef, HostListener, Output, EventEmitter, ViewChild } from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {UserService} from '../../../../services/user.service';
import {AuthService} from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  imports: [
    RouterLink
  ],
  styleUrls: ['./user-dropdown.component.scss']
})
export class UserDropdownComponent {
  isDropdownOpen = false;
  avatarUrl = 'assets/icons/avatar.png';
  userId: string | null = null;

  @ViewChild('dropdownMenu', { static: false }) dropdownMenu!: ElementRef;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {
    this.userService.userId$.subscribe(userId => {
      this.userId = userId;
    });
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
