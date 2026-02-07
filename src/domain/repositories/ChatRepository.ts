import type { ChatMessage, ChatResponse } from '../entities/ChatMessage';

/**
 * ChatRepository Interface - Domain Layer
 * Defines contract for AI chat operations
 */
export interface ChatRepository {
  sendMessage(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<ChatResponse>;
}
