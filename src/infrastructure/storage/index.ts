/**
 * Módulo de Storage Seguro do MindEase
 *
 * Fornece armazenamento criptografado usando:
 * - MMKV com encryption para dados de alta performance
 * - expo-secure-store para credenciais (Keychain/Keystore)
 */

export {
  SecureStorage,
  StorageKeys,
  zustandSecureStorage,
  default,
} from './SecureStorage';
