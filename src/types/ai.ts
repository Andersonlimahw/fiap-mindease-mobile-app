/**
 * Types e interfaces para o sistema de IA híbrido
 * Suporta múltiplos repositórios com estratégia de fallback
 */

export enum AIResponseSource {
  LOCAL = 'local',              // TorchChatRepository (on-device)
  LOCAL_CACHED = 'local_cached', // Resposta em cache local
  OLLAMA = 'ollama',            // OllamaChatRepository (dev/local server)
  CLOUD = 'cloud',              // FirebaseChatRepository (cloud function)
  DEMO = 'demo',                // MockChatRepository (fallback demo)
}

/**
 * Metadata sobre a resposta de IA
 * Útil para debug e analytics
 */
export interface AIResponseMetadata {
  source: AIResponseSource;
  latencyMs: number;
  cached: boolean;
  confidence?: number; // 0-1, se disponível
  model?: string;      // Nome do modelo usado
  timestamp: number;
}

/**
 * Resultado de uma operação de IA
 */
export interface AIResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  metadata: AIResponseMetadata;
}

/**
 * Estratégia de retry com backoff exponencial
 */
export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Configuração de um repositório no seletor
 */
export interface RepositoryConfig {
  name: string;
  enabled: boolean;
  timeout: number;
  retryPolicy: RetryPolicy;
  priority: number; // Ordem de tentativa (0 = maior prioridade)
}

/**
 * Resultado da seleção de repositório
 */
export interface RepositorySelection {
  name: string;
  source: AIResponseSource;
  timeout: number;
}

/**
 * Histórico de tentativas de repositório
 */
export interface RepositoryAttempt {
  name: string;
  source: AIResponseSource;
  success: boolean;
  latencyMs: number;
  error?: string;
  timestamp: number;
}

/**
 * Stats de uso dos repositórios
 * Útil para monitorar qual está funcionando melhor
 */
export interface RepositoryStats {
  name: string;
  source: AIResponseSource;
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;
  lastUsedAt: number;
  successRate: number; // 0-1
}
