/**
 * Sistema de Cache do ByteBank
 *
 * Fornece cache com TTL e múltiplas estratégias:
 * - Cache-First
 * - Network-First
 * - Stale-While-Revalidate
 */

export {
  CacheManager,
  cacheManager,
  CacheTTL,
  CacheKeys,
  default,
} from './CacheManager';

export type { CacheOptions } from './CacheManager';
