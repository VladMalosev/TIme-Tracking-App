import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, map, tap, catchError} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  isAuthenticated(): Observable<boolean> {
    return this.http.get<any>('http://localhost:8080/api/auth/dashboard', { withCredentials: true }).pipe(
      map(response => !!response.email),
      catchError(() => [false])
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true });
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


}
