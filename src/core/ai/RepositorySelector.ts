import { di } from '../di/container';
import type { ChatRepository } from '@app/domain/repositories/ChatRepository';
import type { ChatMessage } from '@app/domain/entities/ChatMessage';
import { AIResponseSource, type AIResponseMetadata } from '@app/types/ai';
import AppConfig from '@app/config/appConfig';

export class RepositorySelector {
  private repositories: Record<string, string> = {
    [AIResponseSource.OLLAMA]: 'OllamaChatRepository',
    [AIResponseSource.FIREBASE]: 'FirebaseChatRepository',
    [AIResponseSource.CLOUD]: 'FirebaseChatRepository',
    [AIResponseSource.MOCK]: 'MockChatRepository',
  };

  constructor(_repos?: any) { }

  async sendMessage(
    userId: string,
    messages: ChatMessage[],
    systemPrompt: string,
    onChunk?: (chunk: string, metadata: AIResponseMetadata) => void
  ): Promise<{ response: string; metadata: AIResponseMetadata }> {
    const order = [
      AIResponseSource.OLLAMA,
      AIResponseSource.FIREBASE,
      AIResponseSource.MOCK,
    ];

    let lastError: Error | null = null;

    for (const source of order) {
      try {
        const repoName = this.repositories[source];
        if (!repoName || !di.has(repoName)) continue;

        const repo = di.get<ChatRepository>(repoName);
        const startTime = Date.now();

        const response = await repo.sendMessage(
          userId,
          messages,
          systemPrompt,
          onChunk ? (chunk: string) => {
            onChunk(chunk, {
              source,
              latencyMs: Date.now() - startTime,
              cached: false,
              timestamp: Date.now(),
              model: source === AIResponseSource.OLLAMA ? AppConfig.ai.defaultModel : 'cloud',
            });
          } : undefined
        );

        const metadata: AIResponseMetadata = {
          source,
          latencyMs: Date.now() - startTime,
          cached: false,
          timestamp: Date.now(),
          model: source === AIResponseSource.OLLAMA ? AppConfig.ai.defaultModel : 'cloud',
        };

        return {
          response: response.content,
          metadata,
        };
      } catch (error) {
        lastError = error as Error;
        if (__DEV__) {
          console.warn(`[RepositorySelector] ${source} failed, trying next...`, error);
        }
      }
    }

    throw lastError || new Error('All AI repositories failed');
  }

  static async sendMessageWithFallback(
    userId: string,
    messages: ChatMessage[],
    systemPrompt: string,
    onChunk?: (chunk: string, metadata: AIResponseMetadata) => void
  ) {
    const instance = new RepositorySelector();
    return instance.sendMessage(userId, messages, systemPrompt, onChunk);
  }
}
