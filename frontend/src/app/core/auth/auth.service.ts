import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, map, tap, catchError, BehaviorSubject, of} from 'rxjs';
import {UserService} from '../../services/user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private userIdSubject = new BehaviorSubject<string | null>(null);

  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  userId$ = this.userIdSubject.asObservable();

  constructor(private http: HttpClient,
              private userService: UserService) {}


  isAuthenticated(): Observable<boolean> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`, { withCredentials: true }).pipe(
      map(response => !!response.email),
      catchError(() => [false])
    );
  }

  checkAuthentication(): void {
    this.http.get<any>(`${this.apiUrl}/dashboard`, { withCredentials: true }).pipe(
      tap(response => {
        this.isLoggedInSubject.next(!!response.email);
        if (response.userId) {
          this.userService.setUserId(response.userId);
        }
      }),
      catchError(() => {
        this.isLoggedInSubject.next(false);
        this.userService.setUserId("");
        return of(false);
      })
    ).subscribe();
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap((response: any) => {
        this.isLoggedInSubject.next(true);
        if (response.userId) {
          this.userIdSubject.next(response.userId);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, {
      withCredentials: true
    }).pipe(
      tap(() => {
        this.isLoggedInSubject.next(false);
        this.userIdSubject.next(null);
        this.userService.setUserId("");
      }),
      catchError(error => {
        console.error('Logout API error:', error);
        this.isLoggedInSubject.next(false);
        this.userIdSubject.next(null);
        this.userService.setUserId("");
        return of({ message: 'Logged out client-side' });
      })
    );
  }

  getCurrentUserEmail(): Observable<string> {
    return this.http.get<{ email: string }>(`${this.apiUrl}/current-user`, { withCredentials: true }).pipe(
      map(response => response.email)
    );
  }

  getOnlineUsers(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/online-users`, { withCredentials: true }).pipe(
      tap(users => console.log('Fetched online users:', users))
    );
  }

  getUserId(): void {
    this.http.get<{ userId: string }>(`${this.apiUrl}/dashboard`, { withCredentials: true }).subscribe(
      (response) => {
        this.userIdSubject.next(response.userId);
      },
      (error) => {
        console.error('Error fetching user ID', error);
      }
    );
  }

  getUserProjectRole(projectId: string): Promise<string> {
    return this.http.get<{ role: string }>(
      `http://localhost:8080/api/projects/${projectId}/current-user-role`,
      { withCredentials: true }
    ).pipe(
      map(response => response.role),
      catchError(() => of('USER'))
    ).toPromise()
      .then(role => role as string);
  }

}
