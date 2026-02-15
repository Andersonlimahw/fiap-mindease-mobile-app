import type { ChatRepository } from '@app/domain/repositories/ChatRepository';
import type { ChatMessage, ChatResponse } from '@app/domain/entities/ChatMessage';
import type {
  AIResponseMetadata,
  AIResponseSource,
  RepositoryAttempt,
  RepositoryStats,
} from '@app/types/ai';
import { AIResponseSource as ResponseSource } from '@app/types/ai';
import AppConfig from '@app/config/appConfig';

/**
 * RepositorySelector - Estratégia inteligente de seleção de repositório
 * 
 * Implementa fallback chain com:
 * - Seleção inteligente com retry
 * - Rastreamento de performance
 * - Fallback automático em caso de falha
 * - Cache de respostas bem-sucedidas
 */
export class RepositorySelector {
  private repositories: Map<AIResponseSource, ChatRepository> = new Map();
  private attempts: RepositoryAttempt[] = [];
  private stats: Map<AIResponseSource, RepositoryStats> = new Map();
  private responseCache: Map<string, ChatResponse & { timestamp: number }> = new Map();
  private maxCacheSize = 100;
  private cacheValidityMs = 3600000; // 1 hora

  constructor(repositories: Record<AIResponseSource, ChatRepository>) {
    Object.entries(repositories).forEach(([source, repo]) => {
      this.repositories.set(source as AIResponseSource, repo);
      this.stats.set(source as AIResponseSource, {
        name: source,
        source: source as AIResponseSource,
        totalAttempts: 0,
        successCount: 0,
        failureCount: 0,
        averageLatencyMs: 0,
        lastUsedAt: 0,
        successRate: 0,
      });
    });
  }

  /**
   * Envia mensagem com fallback automático
   * Tenta repositórios na ordem configurada
   */
  async sendMessage(
    userId: string,
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<{ response: ChatResponse; metadata: AIResponseMetadata }> {
    // Verificar cache primeiro
    const cacheKey = this.getCacheKey(messages);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        response: cached.response,
        metadata: {
          source: ResponseSource.LOCAL_CACHED,
          latencyMs: 0,
          cached: true,
          timestamp: Date.now(),
        },
      };
    }

    // Determinar ordem de tentativa
    const order = this.getRepositoryOrder();

    let lastError: Error | null = null;
    let lastMetadata: AIResponseMetadata | null = null;

    for (const source of order) {
      try {
        const startTime = Date.now();
        const repo = this.repositories.get(source);

        if (!repo) {
          continue;
        }

        // Aplicar timeout
        const timeout = AppConfig.ai.timeouts[source as keyof typeof AppConfig.ai.timeouts] || 5000;
        const response = await Promise.race([
          repo.sendMessage(userId, messages, systemPrompt),
          this.createTimeout(timeout, `${source} timeout`),
        ]);

        const latencyMs = Date.now() - startTime;
        lastMetadata = {
          source,
          latencyMs,
          cached: false,
          timestamp: Date.now(),
          model: AppConfig.ai[source as keyof typeof AppConfig.ai]?.['model'] || undefined,
        };

        // Registrar sucesso
        this.recordSuccess(source, latencyMs);

        // Cachear resposta
        this.addToCache(cacheKey, response);

        return {
          response,
          metadata: lastMetadata,
        };
      } catch (error) {
        const latencyMs = Date.now() - (lastMetadata?.timestamp || Date.now());
        this.recordFailure(source, String(error), latencyMs);
        lastError = error as Error;

        if (__DEV__) {
          console.log(`[RepositorySelector] ${source} failed:`, error);
        }

        // Continuar para o próximo repositório
      }
    }

    // Se chegou aqui, todos falharam
    throw new Error(
      `Todos os repositórios falharam. Último erro: ${lastError?.message}`
    );
  }

  /**
   * Obtém a ordem de tentativa de repositórios
   */
  private getRepositoryOrder(): AIResponseSource[] {
    const order: AIResponseSource[] = [];

    // Primary repository
    if (AppConfig.ai.primaryRepository) {
      order.push(AppConfig.ai.primaryRepository as AIResponseSource);
    }

    // Fallback repositories
    if (AppConfig.ai.fallbackRepositories) {
      order.push(...(AppConfig.ai.fallbackRepositories as AIResponseSource[]));
    }

    // Garantir que demo está sempre no final
    if (!order.includes(ResponseSource.DEMO)) {
      order.push(ResponseSource.DEMO);
    }

    // Remover duplicatas
    return [...new Set(order)];
  }

  /**
   * Registra sucesso de um repositório
   */
  private recordSuccess(source: AIResponseSource, latencyMs: number): void {
    const stats = this.stats.get(source);
    if (!stats) return;

    stats.totalAttempts++;
    stats.successCount++;
    stats.lastUsedAt = Date.now();
    stats.averageLatencyMs =
      (stats.averageLatencyMs * (stats.successCount - 1) + latencyMs) /
      stats.successCount;
    stats.successRate = stats.successCount / stats.totalAttempts;

    this.attempts.push({
      name: source,
      source,
      success: true,
      latencyMs,
      timestamp: Date.now(),
    });

    if (__DEV__) {
      console.log(
        `[RepositorySelector] ${source} success (${latencyMs}ms, rate: ${(stats.successRate * 100).toFixed(1)}%)`
      );
    }
  }

  /**
   * Registra falha de um repositório
   */
  private recordFailure(
    source: AIResponseSource,
    error: string,
    latencyMs: number
  ): void {
    const stats = this.stats.get(source);
    if (!stats) return;

    stats.totalAttempts++;
    stats.failureCount++;
    stats.lastUsedAt = Date.now();
    stats.successRate = stats.successCount / stats.totalAttempts;

    this.attempts.push({
      name: source,
      source,
      success: false,
      latencyMs,
      error,
      timestamp: Date.now(),
    });
  }

  /**
   * Cria uma promise que rejeita após timeout
   */
  private createTimeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    );
  }

  /**
   * Gera chave de cache para uma sequência de mensagens
   */
  private getCacheKey(messages: ChatMessage[]): string {
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop();
    if (!lastUserMsg) return '';
    return `msg:${lastUserMsg.content.substring(0, 100)}`;
  }

  /**
   * Recupera resposta do cache
   */
  private getFromCache(
    key: string
  ): { response: ChatResponse; metadata: AIResponseMetadata } | null {
    if (!key) return null;

    const cached = this.responseCache.get(key);
    if (!cached) return null;

    // Verificar se ainda é válido
    if (Date.now() - cached.timestamp > this.cacheValidityMs) {
      this.responseCache.delete(key);
      return null;
    }

    return {
      response: { content: cached.content },
      metadata: {
        source: ResponseSource.LOCAL_CACHED,
        latencyMs: 0,
        cached: true,
        timestamp: cached.timestamp,
      },
    };
  }

  /**
   * Adiciona resposta ao cache
   */
  private addToCache(key: string, response: ChatResponse): void {
    if (!key || this.responseCache.size >= this.maxCacheSize) {
      if (this.responseCache.size >= this.maxCacheSize) {
        // Remover entrada mais antiga
        const oldest = [...this.responseCache.entries()].sort(
          (a, b) => a[1].timestamp - b[1].timestamp
        )[0];
        if (oldest) {
          this.responseCache.delete(oldest[0]);
        }
      }
    }

    this.responseCache.set(key, {
      ...response,
      timestamp: Date.now(),
    });
  }

  /**
   * Obtém estatísticas de uso
   */
  getStats(): RepositoryStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * Obtém histórico de tentativas
   */
  getAttempts(): RepositoryAttempt[] {
    return [...this.attempts];
  }

  /**
   * Limpa cache
   */
  clearCache(): void {
    this.responseCache.clear();
  }

  /**
   * Limpa histórico de tentativas
   */
  clearAttempts(): void {
    this.attempts = [];
  }

  /**
   * Reseta estatísticas
   */
  resetStats(): void {
    this.stats.forEach((stat) => {
      stat.totalAttempts = 0;
      stat.successCount = 0;
      stat.failureCount = 0;
      stat.successRate = 0;
      stat.averageLatencyMs = 0;
      stat.lastUsedAt = 0;
    });
  }
}
