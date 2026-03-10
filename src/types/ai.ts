
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatResponse {
  message: ChatMessage;
  source: AIResponseSource;
}

export enum AIResponseSource {
  OLLAMA = 'ollama',
  FIREBASE = 'firebase',
  MOCK = 'mock'
}

export interface ChatRepository {
  sendMessage(message: string): Promise<ChatResponse>;
  getMessages(): Promise<ChatMessage[]>;
}
