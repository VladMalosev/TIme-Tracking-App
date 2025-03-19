import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import {UserDropdownComponent} from './user-dropdown/user-dropdown.component';
declare var M: any;

@Component({
  selector: 'app-header',
  imports: [CommonModule, UserDropdownComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, AfterViewInit {
  isLogged = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.isAuthenticated().subscribe(
      (loggedIn) => {
        console.log('User logged in:', loggedIn);
        this.isLogged = loggedIn;
      },
      () => {
        this.isLogged = false;
      }
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const elems = document.querySelectorAll('.dropdown-trigger');
      M.Dropdown.init(elems, { constrainWidth: false, coverTrigger: false });
    }, 0);
  }

  public logout() {
    this.authService.logout();
  }

}
