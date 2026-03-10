import { ChatMessage, ChatResponse } from '@app/domain/entities/ChatMessage';

export enum AIResponseSource {
  OLLAMA = 'ollama',
  CLOUD = 'cloud',
  FIREBASE = 'firebase',
  MOCK = 'mock',
  LOCAL = 'local',
  DEMO = 'demo',
  LOCAL_CACHED = 'local_cached'
}

export interface AIResponseMetadata {
  source: AIResponseSource;
  latencyMs: number;
  cached: boolean;
  timestamp: number;
  model?: string;
  error?: string;
}

export interface RepositoryAttempt {
  name: string;
  source: AIResponseSource;
  success: boolean;
  latencyMs: number;
  timestamp: number;
  error?: string;
}

export interface RepositoryStats {
  name: string;
  source: AIResponseSource;
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;
  lastUsedAt: number;
  successRate: number;
}
