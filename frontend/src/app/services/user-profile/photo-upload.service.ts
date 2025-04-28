import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PhotoUploadService {

  constructor(private http: HttpClient) { }

  uploadPhoto(userId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ photourl: string}>(
      `${environment.apiBaseUrl}/users/${userId}/photo`,
      formData
    );
  }
}
