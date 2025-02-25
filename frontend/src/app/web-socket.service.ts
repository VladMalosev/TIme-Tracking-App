import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { ChatMessage } from './models/ChatMessage';
import SockJS from 'sockjs-client';
import {AuthService} from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private messageSubject = new Subject<ChatMessage>();

  constructor(private authService: AuthService) {}

  connect(email: string): void {
    if (this.stompClient && this.stompClient.connected) {
      return;
    }


    const socket = new SockJS('http://localhost:8080/ws');

    //https://stomp-js.github.io/stomp-websocket/codo/extra/docs-src/Usage.md.html
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
    });


    this.stompClient.onConnect = (frame) => {
      console.log('WebSocket connection established');


      this.stompClient?.subscribe(
        `/user/${email}/queue/message`,
        (message) => {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          this.messageSubject.next(chatMessage);
        }
      );
    };


    this.stompClient.onStompError = (frame) => {
      console.error('WebSocket connection error:', frame.headers['message']);
    };
    this.stompClient.activate();
  }

  sendMessage(message: ChatMessage): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/private-message',
        body: JSON.stringify(message),
      });
    }
  }

  listenForMessages(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }

  closeConnection(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.deactivate().then(() => {
        console.log('WebSocket connection closed');
      });
    }
  }

  private getCurrentUserEmail(): string {
    let email = '';
    this.authService.getCurrentUserEmail().subscribe((userEmail) => {
      email = userEmail;
    });
    return email;
  }
}
