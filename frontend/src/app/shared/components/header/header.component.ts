import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { UserDropdownComponent } from './user-dropdown/user-dropdown.component';
import { MatToolbar } from '@angular/material/toolbar';

@Component({
  selector: 'app-header',
  imports: [CommonModule, UserDropdownComponent, MatToolbar],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isLogged = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.checkAuthentication();

    this.authService.isLoggedIn$.subscribe((loggedIn) => {
      this.isLogged = loggedIn;
    });
  }

}
