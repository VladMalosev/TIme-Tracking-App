export interface ChatMessage {
  content: string;
  sender: { email: string };
  recipientEmail: string;
  timestamp?: string;
}
