import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth'
  constructor(private http: HttpClient) { }

  isAuthenticated(): boolean {
    const token = this.getCookie('JWT');
    console.log('JWT Token:', token);
    return !!token;
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  register(userData: any): Observable<any>{
    return this.http.post(`${this.apiUrl}/register`, userData)
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, {withCredentials:true});
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, {withCredentials:true});
  }

}
