import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, map, tap, catchError, BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  constructor(private http: HttpClient) {}
  private userIdSubject = new BehaviorSubject<string | null>(null);
  userId$ = this.userIdSubject.asObservable();


  isAuthenticated(): Observable<boolean> {
    return this.http.get<any>('http://localhost:8080/api/auth/dashboard', { withCredentials: true }).pipe(
      map(response => !!response.email),
      catchError(() => [false])
    );
  }

  checkAuthentication(): void {
    this.http.get<any>('http://localhost:8080/api/auth/dashboard', { withCredentials: true }).pipe(
      map(response => !!response.email),
      catchError(() => [false])
    ).subscribe(isLoggedIn => this.isLoggedInSubject.next(isLoggedIn));
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap(() => this.checkAuthentication())
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.isLoggedInSubject.next(false))
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
}
