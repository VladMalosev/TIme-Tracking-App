import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userIdSubject = new BehaviorSubject<string | null>(null);
  userId$ = this.userIdSubject.asObservable();

  setUserId(userId: string): void {
    this.userIdSubject.next(userId);
  }

  getCurrentUserId(): string | null {
    return this.userIdSubject.value;
  }
}
