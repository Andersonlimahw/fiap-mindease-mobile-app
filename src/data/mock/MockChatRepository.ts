import type { ChatRepository } from '@app/domain/repositories/ChatRepository';
import type {
  ChatMessage,
  ChatResponse,
} from '@app/domain/entities/ChatMessage';
import { getAIResponse } from '@app/domain/entities/ChatMessage';

const mockMessages: ChatMessage[] = [];

export class MockChatRepository implements ChatRepository {
  async sendMessage(
    userId: string,
    messages: ChatMessage[],
    _systemPrompt: string
  ): Promise<ChatResponse> {
    // Simulate network delay for consistent UX
    await new Promise((resolve) =>
      setTimeout(resolve, 800 + Math.random() * 700)
    );

    const lastUserMsg = messages.filter((m) => m.role === 'user').pop();

    if (!lastUserMsg) {
      throw new Error('No user message found');
    }

    // Store user message
    mockMessages.push({
      ...lastUserMsg,
      id: `mock-${Date.now()}-user`,
    });

    const response = getAIResponse(lastUserMsg?.content ?? '');

    // Store assistant message
    const assistantMsg: ChatMessage = {
      id: `mock-${Date.now()}-assistant`,
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
    };
    mockMessages.push(assistantMsg);

    return { content: response };
  }

  async getMessages(userId: string): Promise<ChatMessage[]> {
    return mockMessages;
  }

  subscribe(
    userId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    // Simulated subscription
    callback(mockMessages);
    return () => {
      // No-op unsubscribe
    };
  }

  async deleteMessage(id: string): Promise<void> {
    const index = mockMessages.findIndex((m) => m.id === id);
    if (index !== -1) {
      mockMessages.splice(index, 1);
    }
  }

  async clearMessages(userId: string): Promise<void> {
    mockMessages.length = 0;
  }
}
