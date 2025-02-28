import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../auth.service';
import { ChatMessage } from '../../models/ChatMessage';
import { WebSocketService } from '../../web-socket.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  public messages: ChatMessage[] = [];
  public newMessage: string = '';
  public recipientEmail: string = '';
  public currentUserEmail: string = '';
  public onlineUsers: string[] = [];
  public previousChatPartners: string[] = [];

  constructor(
    private webSocketService: WebSocketService,
    private authService: AuthService,
    private http: HttpClient
  ) {
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.getCurrentUserEmail().subscribe(
        (email) => {
          this.currentUserEmail = email;
          this.webSocketService.connect(email);

          this.webSocketService.listenForMessages().subscribe((message) => {
            this.messages.push(message);
          });

          this.fetchOnlineUsers();
          this.fetchPreviousChatPartners();
        },
        (error) => {
          console.error('Error fetching current user email:', error);
        }
      );
    }
  }

  fetchOnlineUsers(): void {
    console.log('Fetching online users');
    this.authService.getOnlineUsers().subscribe(
      (users) => {
        console.log('Fetched online users:', users);
        this.onlineUsers = users.filter((user) => user !== this.currentUserEmail);
        console.log('Filtered online users:', this.onlineUsers);
      },
      (error) => {
        console.error('Error fetching online users:', error);
      }
    );
  }

  fetchMessages(senderEmail: string, recipientEmail: string): void {
    this.http.get<ChatMessage[]>(`http://localhost:8080/api/chat/messages`, {
      params: {senderEmail, recipientEmail},
      withCredentials: true,
    }).subscribe(
      (messages) => {
        this.messages = messages;
      },
      (error) => {
        console.error('Error fetching messages:', error);
      }
    );
  }

  onRecipientChange(): void {
    if (this.recipientEmail) {
      this.fetchMessages(this.currentUserEmail, this.recipientEmail);
    }
  }

  sendMessage(): void {
    if (this.newMessage.trim() && this.recipientEmail) {
      const message: ChatMessage = {
        content: this.newMessage,
        sender: {email: this.currentUserEmail},
        recipientEmail: this.recipientEmail,
      };

      this.webSocketService.sendMessage(message);
      this.messages.push(message);
      this.newMessage = '';
    }
  }

  ngOnDestroy(): void {
    this.webSocketService.closeConnection();
  }

  fetchPreviousChatPartners(): void {
    this.http.get<string[]>(`http://localhost:8080/api/chat/previous-chat-partners`, {
      params: {userEmail: this.currentUserEmail},
      withCredentials: true,
    }).subscribe(
      (partners) => {
        this.previousChatPartners = partners;
      },
      (error) => {
        console.error('Error fetching previous chat partners:', error);
      }
    );
  }
}
