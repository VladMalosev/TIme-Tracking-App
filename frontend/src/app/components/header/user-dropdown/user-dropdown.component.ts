import { Component, ElementRef, HostListener, Output, EventEmitter, ViewChild } from '@angular/core';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
  styleUrls: ['./user-dropdown.component.scss']
})
export class UserDropdownComponent {
  @Output() logoutEvent = new EventEmitter<void>();
  isDropdownOpen = false;
  avatarUrl = 'assets/icons/avatar.png';

  @ViewChild('dropdownMenu', { static: false }) dropdownMenu!: ElementRef;

  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout(): void {
    this.logoutEvent.emit();
    this.isDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.dropdownMenu && !this.dropdownMenu.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }
}
