import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PhotoUploadService {
  constructor(private http: HttpClient) {}

  uploadUserPhoto(userId: string, file: File): Observable<{photoUrl: string}> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{photoUrl: string}>(
      `${environment.apiBaseUrl}/users/${userId}/photo`,
      formData,
      { withCredentials: true }
    );
  }
}
