import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {catchError, map, Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class NoAuthGuard implements CanActivate {

  constructor(private http: HttpClient, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.http.get<any>('http://localhost:8080/api/auth/dashboard', { withCredentials: true }).pipe(
      map(response => {
        // User is authenticated, redirect to dashboard
        this.router.navigate(['/dashboard']);
        return false;
      }),
      catchError(error => {
        // User is not authenticated, allow access to login/register
        return of(true);
      })
    );
  }
}
