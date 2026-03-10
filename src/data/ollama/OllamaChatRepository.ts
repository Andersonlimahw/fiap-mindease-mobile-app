import { ChatRepository } from '@domain/repositories/ChatRepository';
import {
  ChatMessage,
  ChatResponse,
} from '@domain/entities/ChatMessage';
import AppConfig from '@config/appConfig';

const OLLAMA_TIMEOUT_MS = 30_000;

export class OllamaChatRepository implements ChatRepository {
  async sendMessage(
    userId: string,
    messages: ChatMessage[],
    systemPrompt: string,
    onChunk?: (chunk: string) => void
  ): Promise<ChatResponse> {
    const ollamaMessages: any[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content || '',
      })),
    ];

    try {
      if (onChunk) {
        return await new Promise<ChatResponse>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${AppConfig.ai.ollamaUrl}/api/chat`);
          xhr.setRequestHeader('Content-Type', 'application/json');

          let processedLen = 0;
          let fullContent = '';
          const timeoutId = setTimeout(() => {
            xhr.abort();
            reject(new Error('Ollama request timed out'));
          }, OLLAMA_TIMEOUT_MS);

          xhr.onreadystatechange = () => {
            if (xhr.readyState === 3 || xhr.readyState === 4) {
              const newData = xhr.responseText.substring(processedLen);
              processedLen = xhr.responseText.length;

              const lines = newData.split('\n');
              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const chunkObj = JSON.parse(line);
                    if (chunkObj.message?.content) {
                      onChunk(chunkObj.message.content);
                      fullContent += chunkObj.message.content;
                    }
                  } catch (e) {
                    // Ignore partial JSON
                  }
                }
              }
            }
          };

          xhr.onload = () => {
            clearTimeout(timeoutId);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({ content: fullContent });
            } else {
              reject(new Error(`Ollama API error: ${xhr.status}`));
            }
          };

          xhr.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error('Network request failed'));
          };

          xhr.send(JSON.stringify({
            model: AppConfig.ai.defaultModel,
            messages: ollamaMessages,
            stream: true,
          }));
        });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

      const response = await fetch(`${AppConfig.ai.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: AppConfig.ai.defaultModel,
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
      return { content: data.message?.content ?? '' };
    } catch (error) {
      if (__DEV__) {
        console.warn('[OllamaChatRepository] Request failed:', error);
      }
      throw error;
    }
  }

  async saveMessage(userId: string, message: Partial<ChatMessage>): Promise<string> {
    return `ollama-${Date.now()}`;
  }

  async getMessages(userId: string): Promise<ChatMessage[]> {
    return [];
  }

  subscribe(userId: string, callback: (messages: ChatMessage[]) => void): () => void {
    callback([]);
    return () => { };
  }

  async deleteMessage(id: string, _userId?: string): Promise<void> { }
  async clearMessages(userId: string): Promise<void> { }
}
