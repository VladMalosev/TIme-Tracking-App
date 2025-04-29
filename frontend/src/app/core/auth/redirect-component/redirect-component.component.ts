import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  template: ''
})
export class RedirectComponent implements OnInit {
  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any>('http://localhost:8080/api/auth/dashboard', { withCredentials: true })
      .pipe(
        map(response => {
          this.router.navigate(['/dashboard']);
          return true;
        }),
        catchError(error => {
          this.router.navigate(['/']);
          return of(false);
        })
      )
      .subscribe();
  }
}
