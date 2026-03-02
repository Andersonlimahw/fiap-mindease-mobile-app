import type { ChatRepository } from '@app/domain/repositories/ChatRepository';
import type {
  ChatMessage,
  ChatResponse,
  OllamaMessage,
} from '@app/domain/entities/ChatMessage';
import AppConfig from '@app/config/appConfig';

const OLLAMA_TIMEOUT_MS = 30_000;

export class OllamaChatRepository implements ChatRepository {
  async sendMessage(
    userId: string,
    messages: ChatMessage[],
    systemPrompt: string,
    onChunk?: (chunk: string) => void
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
      if (onChunk) {
        // Stream reading via XMLHttpRequest (widely supported React Native polyfill)
        return await new Promise<ChatResponse>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${AppConfig.ai.ollama.url}/api/chat`);
          xhr.setRequestHeader('Content-Type', 'application/json');
          if (AppConfig.ai.ollama.apiKey) {
            xhr.setRequestHeader('Authorization', `Bearer ${AppConfig.ai.ollama.apiKey}`);
          }

          let processedLen = 0;
          let fullContent = '';
          const timeoutId = setTimeout(() => {
            xhr.abort();
            reject(new Error('Ollama request timed out'));
          }, OLLAMA_TIMEOUT_MS);

          xhr.onreadystatechange = () => {
            // 3 = LOADING, 4 = DONE
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
                    // Ignore JSON parsing errors for partial chunks
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
              reject(new Error(`Ollama API error: ${xhr.status} ${xhr.responseText}`));
            }
          };

          xhr.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error('Network request failed'));
          };

          xhr.send(JSON.stringify({
            model: AppConfig.ai.ollama.model,
            messages: ollamaMessages,
            stream: true,
          }));
        });
      }

      // Non-streaming fallback
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

      const response = await fetch(`${AppConfig.ai.ollama.url}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(AppConfig.ai.ollama.apiKey ? { Authorization: `Bearer ${AppConfig.ai.ollama.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: AppConfig.ai.ollama.model,
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
        content: data.message?.content ?? '',
      };
    } catch (error) {
      if (__DEV__) {
        console.warn('[OllamaChatRepository] Request failed:', error);
      }
      throw error; // Retornar o erro real para o RepositorySelector acionar o fallback real
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
    return () => { };
  }

  async deleteMessage(id: string): Promise<void> {
    // No-op delete
  }

  async clearMessages(userId: string): Promise<void> {
    // No-op clear
  }
}
