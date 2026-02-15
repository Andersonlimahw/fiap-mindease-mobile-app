import type { ChatRepository } from '@app/domain/repositories/ChatRepository';
import type {
  ChatMessage,
  ChatResponse,
  OllamaMessage,
} from '@app/domain/entities/ChatMessage';
import { getAIResponse } from '@app/domain/entities/ChatMessage';
import AppConfig from '@app/config/appConfig';

const OLLAMA_TIMEOUT_MS = 30_000;

export class OllamaChatRepository implements ChatRepository {
  async sendMessage(
    userId: string,
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<ChatResponse> {
    const ollamaMessages: OllamaMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(
        (m): OllamaMessage => ({
          role: m.role,
          content: m.content,
        })
      ),
    ];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        OLLAMA_TIMEOUT_MS
      );

      const response = await fetch(`${AppConfig.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          messages: ollamaMessages,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        content: data.message?.content ?? getAIResponse(messages[messages.length - 1]?.content ?? ''),
      };
    } catch (error) {
      if (__DEV__) {
        console.warn('[OllamaChatRepository] Falling back to demo response:', error);
      }
      const lastUserMsg = messages.filter((m) => m.role === 'user').pop();
      return {
        content: getAIResponse(lastUserMsg?.content ?? ''),
      };
    }
  }

  async getMessages(userId: string): Promise<ChatMessage[]> {
    // Ollama doesn't persist messages, return empty array
    return [];
  }

  subscribe(
    userId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    // No-op subscription for Ollama (stateless)
    callback([]);
    return () => {};
  }

  async deleteMessage(id: string): Promise<void> {
    // No-op delete
  }

  async clearMessages(userId: string): Promise<void> {
    // No-op clear
  }
}
