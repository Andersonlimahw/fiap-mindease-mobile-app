import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SecureStorage - Camada de armazenamento seguro para o MindEase
 *
 * Utiliza:
 * - expo-secure-store para credenciais sensíveis (tokens, senhas) - Keychain/Keystore
 * - AsyncStorage para dados gerais (fallback quando SecureStore não suportado)
 *
 * @example
 * // Para credenciais altamente sensíveis
 * await SecureStorage.setSecureItem('auth_token', token);
 * const token = await SecureStorage.getSecureItem('auth_token');
 *
 * // Para dados gerais
 * await SecureStorage.setItem('user_preferences', JSON.stringify(prefs));
 * const prefs = await SecureStorage.getItem('user_preferences');
 */

// ============================================
// SECURE STORAGE API
// ============================================

export const SecureStorage = {
  /**
   * Armazena um valor (AsyncStorage com prefixo seguro)
   * Use para: cache, preferências, dados do usuário
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`@bb_secure:${key}`, value);
    } catch (error) {
      console.error(`[SecureStorage] Erro ao salvar "${key}":`, error);
      throw error;
    }
  },

  /**
   * Recupera um valor (AsyncStorage)
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`@bb_secure:${key}`);
    } catch (error) {
      console.error(`[SecureStorage] Erro ao ler "${key}":`, error);
      return null;
    }
  },

  /**
   * Remove um valor (AsyncStorage)
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`@bb_secure:${key}`);
    } catch (error) {
      console.error(`[SecureStorage] Erro ao remover "${key}":`, error);
    }
  },

  /**
   * Verifica se uma chave existe (AsyncStorage)
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(`@bb_secure:${key}`);
      return value !== null;
    } catch (error) {
      return false;
    }
  },

  /**
   * Lista todas as chaves armazenadas
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys
        .filter((k) => k.startsWith('@bb_secure:'))
        .map((k) => k.replace('@bb_secure:', ''));
    } catch (error) {
      console.error('[SecureStorage] Erro ao listar chaves:', error);
      return [];
    }
  },

  /**
   * Limpa todo o storage
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.getAllKeys();
      await AsyncStorage.multiRemove(keys.map((k) => `@bb_secure:${k}`));
    } catch (error) {
      console.error('[SecureStorage] Erro ao limpar storage:', error);
    }
  },

  // ============================================
  // SECURE STORE (para credenciais sensíveis - Keychain/Keystore)
  // ============================================

  /**
   * Armazena credencial altamente sensível (Keychain/Keystore)
   * Use para: tokens de autenticação, senhas, chaves de API
   */
  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.error(`[SecureStorage] Erro ao salvar credencial "${key}":`, error);
      throw error;
    }
  },

  /**
   * Recupera credencial sensível (Keychain/Keystore)
   */
  async getSecureItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Erro ao ler credencial "${key}":`, error);
      return null;
    }
  },

  /**
   * Remove credencial sensível (Keychain/Keystore)
   */
  async removeSecureItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`[SecureStorage] Erro ao remover credencial "${key}":`, error);
    }
  },

  // ============================================
  // HELPERS PARA DADOS ESTRUTURADOS
  // ============================================

  /**
   * Armazena objeto JSON
   */
  async setObject<T>(key: string, value: T): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  },

  /**
   * Recupera objeto JSON
   */
  async getObject<T>(key: string): Promise<T | null> {
    const raw = await this.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Armazena número
   */
  async setNumber(key: string, value: number): Promise<void> {
    await this.setItem(key, String(value));
  },

  /**
   * Recupera número
   */
  async getNumber(key: string): Promise<number | null> {
    const raw = await this.getItem(key);
    if (!raw) return null;
    const num = parseFloat(raw);
    return isNaN(num) ? null : num;
  },

  /**
   * Armazena boolean
   */
  async setBoolean(key: string, value: boolean): Promise<void> {
    await this.setItem(key, value ? 'true' : 'false');
  },

  /**
   * Recupera boolean
   */
  async getBoolean(key: string): Promise<boolean | null> {
    const raw = await this.getItem(key);
    if (raw === null) return null;
    return raw === 'true';
  },
};

// ============================================
// CHAVES DE STORAGE PREDEFINIDAS
// ============================================

export const StorageKeys = {
  // Auth
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_SESSION: 'user_session',
  BIOMETRIC_ENABLED: 'biometric_enabled',

  // User data (cached)
  USER_PROFILE: 'user_profile',
  TASKS_CACHE: 'tasks_cache',
  FOCUS_STATS: 'focus_stats',

  // Preferences
  THEME_MODE: 'theme_mode',
  LANGUAGE: 'language',
  ONBOARDING_COMPLETED: 'onboarding_completed',

  // Cache
  CACHE_TIMESTAMP: 'cache_timestamp',
} as const;

// ============================================
// ZUSTAND PERSIST STORAGE ADAPTER
// ============================================

/**
 * Adapter para usar SecureStorage com Zustand persist
 *
 * @example
 * import { create } from 'zustand';
 * import { persist } from 'zustand/middleware';
 * import { zustandSecureStorage } from '@infrastructure/storage/SecureStorage';
 *
 * const useStore = create(
 *   persist(
 *     (set) => ({ ... }),
 *     {
 *       name: 'my-store',
 *       storage: zustandSecureStorage,
 *     }
 *   )
 * );
 */
export const zustandSecureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return SecureStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStorage.removeItem(name);
  },
};

export default SecureStorage;
