import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TimeTrackingService {

  constructor(private http: HttpClient) { }

  getTimeLoggedForWeek(userId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/timelogs/user/${userId}/stats`, {
      withCredentials: true
    });
  }
}
