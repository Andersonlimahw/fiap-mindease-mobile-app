import type { ChatMessage, ChatResponse } from '../entities/ChatMessage';

/**
 * ChatRepository Interface - Domain Layer
 * Defines contract for AI chat operations
 */
export interface ChatRepository {
  sendMessage(
    userId: string,
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<ChatResponse>;

  /**
   * Get all chat messages for a user
   */
  getMessages(userId: string): Promise<ChatMessage[]>;

  /**
   * Subscribe to real-time chat messages
   */
  subscribe(
    userId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void;

  /**
   * Delete a message
   */
  deleteMessage(id: string): Promise<void>;

  /**
   * Clear all messages for a user
   */
  clearMessages(userId: string): Promise<void>;
}

