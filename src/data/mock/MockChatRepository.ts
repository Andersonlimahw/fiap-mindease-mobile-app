import type { ChatRepository } from '@app/domain/repositories/ChatRepository';
import type {
  ChatMessage,
  ChatResponse,
} from '@app/domain/entities/ChatMessage';
import { getAIResponse } from '@app/domain/entities/ChatMessage';

export class MockChatRepository implements ChatRepository {
  async sendMessage(
    messages: ChatMessage[],
    _systemPrompt: string
  ): Promise<ChatResponse> {
    // Simulate network delay for consistent UX
    await new Promise((resolve) =>
      setTimeout(resolve, 800 + Math.random() * 700)
    );

    const lastUserMsg = messages.filter((m) => m.role === 'user').pop();

    return {
      content: getAIResponse(lastUserMsg?.content ?? ''),
    };
  }
}
