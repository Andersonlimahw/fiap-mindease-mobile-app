import { SecureStorage } from '../storage/SecureStorage';

/**
 * CacheManager - Sistema de cache com TTL para o MindEase
 *
 * IMPORTANTE: Este cache deve ser usado APENAS para APIs externas (BRAPI, etc).
 * Para dados do Firebase, NÃO use cache pois o Firestore já gerencia
 * sincronização em tempo real e offline persistence.
 *
 * Estratégias suportadas:
 * - Cache-First: Retorna cache se válido, senão busca da fonte
 * - Network-First: Tenta rede primeiro, fallback para cache
 * - Stale-While-Revalidate: Retorna cache imediatamente e atualiza em background
 *
 * @example
 * // Para cotações da BRAPI (API externa)
 * const data = await cache.staleWhileRevalidate('b3:quote:PETR4', () => fetchQuote('PETR4'), { ttl: CacheTTL.SHORT });
 */

type CacheOptionsBase = {
  /** Forçar busca ignorando cache */
  forceRefresh?: boolean;
  /** Callback quando cache é atualizado em background */
  onBackgroundUpdate?: (data: unknown) => void;
};

type CacheOptionsWithTTL = CacheOptionsBase & {
  /**
   * Time-to-live em milissegundos (padrão: 5 minutos).
   *
   * ATENÇÃO: TTL customizado é exclusivo para BRAPI e APIs externas.
   * Não utilize TTL para dados do Firebase/Firestore.
   */
  ttl?: number;
};

type CacheOptionsWithoutTTL = CacheOptionsBase & {
  /** TTL não permitido para dados internos/Firebase */
  ttl?: never;
};

export type BrapiQuoteCacheKey = `b3:quote:${string}`;
export type CurrencyQuoteCacheKey = `currency:${string}`;
export type ExternalCacheKey = BrapiQuoteCacheKey | CurrencyQuoteCacheKey;

/**
 * Opções de cache: TTL customizado liberado apenas para chaves externas (BRAPI).
 */
export type CacheOptions<K extends string = string> = K extends ExternalCacheKey
  ? CacheOptionsWithTTL
  : CacheOptionsWithoutTTL;

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos
const CACHE_PREFIX = 'cache:';

export class CacheManager {
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private pendingRequests: Map<string, Promise<unknown>> = new Map();

  /**
   * Cache-First Strategy
   * Retorna dados do cache se válidos, senão busca da fonte
   */
  async cacheFirst<T, K extends string>(
    key: K,
    fetcher: () => Promise<T>,
    options?: CacheOptions<K>
  ): Promise<T> {
    const opts = (options ?? {}) as CacheOptions<K>;
    const forceRefresh = opts.forceRefresh ?? false;
    const cacheKey = CACHE_PREFIX + key;
    const ttl = this.resolveTTL(cacheKey, options);

    // Se não forçar refresh, tenta cache
    if (!forceRefresh) {
      const cached = await this.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Busca da fonte e cacheia
    const data = await this.dedupedFetch(cacheKey, fetcher);
    await this.set(cacheKey, data, ttl);
    return data;
  }

  /**
   * Network-First Strategy
   * Tenta rede primeiro, fallback para cache se falhar
   */
  async networkFirst<T, K extends string>(
    key: K,
    fetcher: () => Promise<T>,
    options?: CacheOptions<K>
  ): Promise<T> {
    const opts = (options ?? {}) as CacheOptions<K>;
    const cacheKey = CACHE_PREFIX + key;
    const ttl = this.resolveTTL(cacheKey, options);

    try {
      const data = await this.dedupedFetch(cacheKey, fetcher);
      await this.set(cacheKey, data, ttl);
      return data;
    } catch (error) {
      // Fallback para cache
      const cached = await this.get<T>(cacheKey);
      if (cached !== null) {
        if (__DEV__) {
          console.log(`[CacheManager] Network failed, using cache for "${key}"`);
        }
        return cached;
      }
      throw error;
    }
  }

  /**
   * Stale-While-Revalidate Strategy
   * Retorna cache imediatamente (se disponível) e atualiza em background
   */
  async staleWhileRevalidate<T, K extends string>(
    key: K,
    fetcher: () => Promise<T>,
    options?: CacheOptions<K>
  ): Promise<T> {
    const opts = (options ?? {}) as CacheOptions<K>;
    const cacheKey = CACHE_PREFIX + key;
    const ttl = this.resolveTTL(cacheKey, options);
    const onBackgroundUpdate = opts.onBackgroundUpdate;

    const cached = await this.get<T>(cacheKey);

    // Atualiza em background
    const backgroundUpdate = async () => {
      try {
        const data = await fetcher();
        await this.set(cacheKey, data, ttl);
        onBackgroundUpdate?.(data);
        return data;
      } catch (error) {
        if (__DEV__) {
          console.warn(`[CacheManager] Background update failed for "${key}":`, error);
        }
        return null;
      }
    };

    if (cached !== null) {
      // Retorna cache e atualiza em background
      backgroundUpdate();
      return cached;
    }

    // Sem cache, busca da fonte
    const data = await backgroundUpdate();
    if (data === null) {
      throw new Error(`Failed to fetch data for "${key}"`);
    }
    return data;
  }

  /**
   * Obtém valor do cache (memória ou persistente)
   */
  async get<T>(key: string): Promise<T | null> {
    // Tenta memória primeiro
    const memoryEntry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (memoryEntry && this.isValid(memoryEntry)) {
      return memoryEntry.data;
    }

    // Tenta storage persistente
    try {
      const stored = await SecureStorage.getItem(key);
      if (stored) {
        const entry = JSON.parse(stored) as CacheEntry<T>;
        if (this.isValid(entry)) {
          // Atualiza cache de memória
          this.memoryCache.set(key, entry);
          return entry.data;
        } else {
          // Remove entrada expirada
          await SecureStorage.removeItem(key);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`[CacheManager] Error reading cache for "${key}":`, error);
      }
    }

    return null;
  }

  /**
   * Armazena valor no cache (memória e persistente)
   */
  async set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Memória
    this.memoryCache.set(key, entry);

    // Persistente
    try {
      await SecureStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      if (__DEV__) {
        console.warn(`[CacheManager] Error storing cache for "${key}":`, error);
      }
    }
  }

  /**
   * Remove entrada do cache
   */
  async remove(key: string): Promise<void> {
    const cacheKey = key.startsWith(CACHE_PREFIX) ? key : CACHE_PREFIX + key;
    this.memoryCache.delete(cacheKey);
    await SecureStorage.removeItem(cacheKey);
  }

  /**
   * Invalida todas as entradas que começam com um prefixo
   */
  async invalidatePrefix(prefix: string): Promise<void> {
    const fullPrefix = CACHE_PREFIX + prefix;

    // Memória
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(fullPrefix)) {
        this.memoryCache.delete(key);
      }
    }

    // Persistente
    const allKeys = await SecureStorage.getAllKeys();
    for (const key of allKeys) {
      if (key.startsWith(fullPrefix)) {
        await SecureStorage.removeItem(key);
      }
    }
  }

  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.pendingRequests.clear();

    const allKeys = await SecureStorage.getAllKeys();
    for (const key of allKeys) {
      if (key.startsWith(CACHE_PREFIX)) {
        await SecureStorage.removeItem(key);
      }
    }
  }

  private resolveTTL(
    key: string,
    options?: CacheOptionsWithTTL | CacheOptionsWithoutTTL
  ): number {
    const ttl = options ? (options as CacheOptionsWithTTL).ttl : undefined;
    if (typeof ttl === "number") {
      this.warnIfInvalidTTLUsage(key, ttl);
      return ttl;
    }
    return DEFAULT_TTL;
  }

  /**
   * Aviso em modo dev quando TTL customizado é usado fora da BRAPI
   */
  private warnIfInvalidTTLUsage(key: string, ttl: number) {
    if (!__DEV__) {
      return;
    }
    if (
      key.startsWith(`${CACHE_PREFIX}b3:`) ||
      key.startsWith(`${CACHE_PREFIX}currency:`)
    ) {
      return;
    }
    console.warn(
      `[CacheManager] TTL customizado é reservado para BRAPI. Chave "${key}" deve usar TTL padrão.`
    );
  }

  /**
   * Verifica se uma entrada ainda é válida
   */
  private isValid(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Deduplica requisições simultâneas para a mesma chave
   */
  private async dedupedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Se já existe uma requisição pendente, retorna ela
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    // Cria nova requisição
    const request = fetcher().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, request);
    return request;
  }
}

// ============================================
// INSTÂNCIA SINGLETON
// ============================================

export const cacheManager = new CacheManager();

// ============================================
// TTL PRESETS (APENAS PARA BRAPI/APIs externas)
// Não utilize estes valores para dados do Firebase.
// ============================================

export const CacheTTL = {
  /** 30 segundos - para dados muito voláteis */
  VERY_SHORT: 30 * 1000,
  /** 1 minuto */
  SHORT: 60 * 1000,
  /** 5 minutos - padrão */
  MEDIUM: 5 * 60 * 1000,
  /** 15 minutos */
  LONG: 15 * 60 * 1000,
  /** 1 hora */
  VERY_LONG: 60 * 60 * 1000,
  /** 24 horas */
  DAY: 24 * 60 * 60 * 1000,
} as const;

// ============================================
// CACHE KEYS - APENAS PARA APIS EXTERNAS
// ============================================

/**
 * Chaves de cache para APIs externas (BRAPI, moedas, etc).
 *
 * ATENÇÃO: NÃO adicione chaves para dados do Firebase aqui.
 * Firebase Firestore já possui seu próprio sistema de cache e
 * sincronização em tempo real.
 */
type CacheKeyFactories = {
  B3_QUOTE: (ticker: string) => BrapiQuoteCacheKey;
  CURRENCY_QUOTE: (pair: string) => CurrencyQuoteCacheKey;
};

export const CacheKeys: CacheKeyFactories = {
  // Cotações B3 (BRAPI) - única API externa que deve usar cache
  B3_QUOTE: (ticker: string) => `b3:quote:${ticker}`,

  // Cotações de moedas (APIs externas)
  CURRENCY_QUOTE: (pair: string) => `currency:${pair}`,
};

export default cacheManager;
