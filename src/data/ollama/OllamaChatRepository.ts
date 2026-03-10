import type { ChatRepository } from '../domain/repositories/ChatRepository';
import type {
  ChatMessage,
  ChatResponse,
  OllamaMessage,
} from '../domain/entities/ChatMessage';
import AppConfig from '../config/appConfig';

// Ollama API Web Search endpoints configuration
const OLLAMA_API_BASE = 'https://ollama.com/api';


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
      ...messages.map((m) => {
        // If message has tool_calls or role="tool", map them properly
        const msg: any = {
          role: m.role,
          content: m.content || '',
        };
        // Basic mapping for future expanded ChatMessage type
        if ((m as any).tool_calls) msg.tool_calls = (m as any).tool_calls;
        if ((m as any).tool_name) msg.name = (m as any).tool_name;
        return msg;
      }),
    ];

    const tools = [
      {
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Search the web for real-time information. Returns a list of search results with titles, URLs, and snippets.',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The search query string' },
              max_results: { type: 'integer', description: 'Maximum results to return (default 5)' }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'web_fetch',
          description: 'Fetch the text content of a specific web URL.',
          parameters: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'The valid URL to fetch' }
            },
            required: ['url']
          }
        }
      }
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

          let toolCalls: any[] = [];

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
                    if (chunkObj.message?.tool_calls) {
                      // OLLAMA sends the complete tool_call block in stream (not partial chunks like openai)
                      // or if it sends partial, we merge them. Usually it's complete arrays.
                      for (const tc of chunkObj.message.tool_calls) {
                        toolCalls.push(tc);
                      }
                    }
                  } catch (e) {
                    // Ignore JSON parsing errors for partial chunks
                  }
                }
              }
            }
          };

          xhr.onload = async () => {
            clearTimeout(timeoutId);
            if (xhr.status >= 200 && xhr.status < 300) {
              // Handle tool calls if they exist
              if (toolCalls.length > 0) {
                try {
                  const newContext = await this.handleToolCalls(toolCalls, ollamaMessages);
                  // Rerun the prompt with tool results
                  const secondResponse = await this.sendMessageWithContext(newContext, onChunk);
                  resolve({ content: fullContent + secondResponse.content });
                  return;
                } catch (toolErr) {
                  reject(toolErr);
                  return;
                }
              }
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
            tools: tools,
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
          tools: tools,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();

      let finalContent = data.message?.content ?? '';

      if (data.message?.tool_calls && data.message.tool_calls.length > 0) {
        const newContext = await this.handleToolCalls(data.message.tool_calls, ollamaMessages);
        const secondResp = await this.sendMessageWithContext(newContext);
        finalContent += '\n' + secondResp.content;
      }

      return {
        content: finalContent,
      };
    } catch (error) {
      if (__DEV__) {
        console.warn('[OllamaChatRepository] Request failed:', error);
      }
      throw error; // Retornar o erro real para o RepositorySelector acionar o fallback real
    }
  }

  async saveMessage(userId: string, message: Partial<ChatMessage>): Promise<string> {
    // Ollama doesn't persist, so we just return a temporary ID
    return `ollama-${Date.now()}`;
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

  async deleteMessage(id: string, _userId?: string): Promise<void> {
    // No-op delete
  }

  async clearMessages(userId: string): Promise<void> {
    // No-op clear
  }

  // --- Helper methods for Tool Calling ---

  private async handleToolCalls(toolCalls: any[], context: any[]): Promise<any[]> {
    const newContext = [...context];

    // Append the assistant message with tool_calls to the context
    newContext.push({
      role: 'assistant',
      content: '', // Usually empty when calling tools
      tool_calls: toolCalls,
    });

    for (const tc of toolCalls) {
      try {
        if (tc.function.name === 'web_search') {
          const args = tc.function.arguments;
          const res = await fetch(`${OLLAMA_API_BASE}/web_search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: args.query, max_results: args.max_results || 5 }),
          });
          if (res.ok) {
            const data = await res.json();
            newContext.push({
              role: 'tool',
              name: 'web_search',
              content: JSON.stringify(data.results || data)
            });
          } else {
            newContext.push({ role: 'tool', name: 'web_search', content: `Error: ${res.status}` });
          }
        }
        else if (tc.function.name === 'web_fetch') {
          const args = tc.function.arguments;
          const res = await fetch(`${OLLAMA_API_BASE}/web_fetch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: args.url }),
          });
          if (res.ok) {
            const data = await res.json();
            newContext.push({
              role: 'tool',
              name: 'web_fetch',
              content: JSON.stringify(data)
            });
          } else {
            newContext.push({ role: 'tool', name: 'web_fetch', content: `Error: ${res.status}` });
          }
        }
      } catch (e) {
        newContext.push({ role: 'tool', name: tc.function.name, content: `Failed to execute: ${e}` });
      }
    }
    return newContext;
  }

  private async sendMessageWithContext(
    messages: any[],
    onChunk?: (chunk: string) => void
  ): Promise<ChatResponse> {
    try {
      if (onChunk) {
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
            reject(new Error('Ollama request timed out after tool call'));
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
                  } catch (e) { }
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
            messages: messages,
            stream: true,
          }));
        });
      }

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
          messages: messages,
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
      throw error;
    }
  }
}

