import {AfterViewInit, Component, EventEmitter, Output} from '@angular/core';
declare var M: any;

@Component({
  selector: 'app-user-dropdown',
  imports: [],
  templateUrl: './user-dropdown.component.html',
  styleUrl: './user-dropdown.component.css'
})

export class UserDropdownComponent implements AfterViewInit {
  @Output() logoutEvent = new EventEmitter<void>();

  ngAfterViewInit(): void {
    setTimeout(() => {
      const elems = document.querySelectorAll('.dropdown-trigger');
      M.Dropdown.init(elems, { constrainWidth: false, coverTrigger: false });
    }, 0);
  }

  preventNavigation(event: Event): void {
    event.preventDefault();
  }

  logout(): void {
    this.logoutEvent.emit();
  }
}
