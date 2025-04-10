import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExportTimeLogService {
  constructor(private http: HttpClient) {}


  getTimeLogsForExport(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${environment.apiBaseUrl}/timelogs/project/${projectId}/export`,
      { withCredentials: true }
    );
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}
