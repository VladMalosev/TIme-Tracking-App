import {ActivatedRouteSnapshot, CanActivate, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';
import {AuthService} from './auth.service';
import {catchError, map, Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';


@Injectable({
  providedIn: 'root',
})


export class AuthGuard implements CanActivate {

  constructor(private http: HttpClient, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.http.get<any>('http://localhost:8080/api/auth/dashboard', { withCredentials: true }).pipe(
      map(response => {
        return true;
      }),
      catchError(error => {
        if (error.status === 401 || error.status === 403) {
          this.router.navigate(['/login']);
        }
        return [false];
      })
    );
  }
}
