import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  constructor(private http: HttpClient) {}

  getUserActivities(userId: string, projectId?: string): Observable<any[]> {
    const params: any = {};
    if (projectId) {
      params.projectId = projectId;
    }

    return this.http.get<any[]>(`${environment.apiBaseUrl}/activities/user/${userId}`, { params, withCredentials: true })
      .pipe(
        map(activities => activities.map(activity => ({
          ...activity,
          time: this.formatActivityTime(activity.createdAt)
        })))
      );
  }

  private formatActivityTime(timestamp: string): string {
    const now = new Date();
    const activityDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return activityDate.toLocaleDateString();
    }
  }
}
