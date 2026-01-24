import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { SecureStorage, StorageKeys } from '../../infrastructure/storage/SecureStorage';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export type BiometricAuthResult = {
  success: boolean;
  error?: string;
};

export type UseBiometricAuthReturn = {
  /** Se a biometria está disponível no dispositivo */
  isAvailable: boolean;
  /** Se a biometria está habilitada pelo usuário */
  isEnabled: boolean;
  /** Tipo de biometria disponível */
  biometricType: BiometricType;
  /** Se está carregando o estado inicial */
  loading: boolean;
  /** Autentica usando biometria */
  authenticate: (reason?: string) => Promise<BiometricAuthResult>;
  /** Habilita/desabilita biometria para o app */
  setEnabled: (enabled: boolean) => Promise<void>;
  /** Nome amigável do tipo de biometria */
  biometricTypeName: string;
};

/**
 * Hook para autenticação biométrica
 *
 * @example
 * const { isAvailable, isEnabled, authenticate, setEnabled, biometricTypeName } = useBiometricAuth();
 *
 * // Autenticar
 * const handleSecureAction = async () => {
 *   const result = await authenticate('Confirme sua identidade');
 *   if (result.success) {
 *     // Prosseguir com ação segura
 *   }
 * };
 *
 * // Habilitar biometria nas configurações
 * const toggleBiometric = async () => {
 *   await setEnabled(!isEnabled);
 * };
 */
export function useBiometricAuth(): UseBiometricAuthReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [loading, setLoading] = useState(true);

  // Verifica disponibilidade e configuração inicial
  useEffect(() => {
    async function checkBiometrics() {
      try {
        // Verifica se o hardware suporta biometria
        const compatible = await LocalAuthentication.hasHardwareAsync();
        if (!compatible) {
          setIsAvailable(false);
          setLoading(false);
          return;
        }

        // Verifica se há biometria cadastrada
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsAvailable(enrolled);

        // Obtém o tipo de biometria suportada
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('facial');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('fingerprint');
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('iris');
        } else {
          setBiometricType('none');
        }

        // Verifica se o usuário habilitou biometria no app
        const enabled = await SecureStorage.getBoolean(StorageKeys.BIOMETRIC_ENABLED);
        setIsEnabled(enabled ?? false);
      } catch (error) {
        console.error('[useBiometricAuth] Erro ao verificar biometria:', error);
        setIsAvailable(false);
      } finally {
        setLoading(false);
      }
    }

    checkBiometrics();
  }, []);

  // Função de autenticação
  const authenticate = useCallback(
    async (reason?: string): Promise<BiometricAuthResult> => {
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometria não disponível neste dispositivo',
        };
      }

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: reason || 'Confirme sua identidade',
          cancelLabel: 'Cancelar',
          disableDeviceFallback: false,
          fallbackLabel: 'Usar senha',
        });

        if (result.success) {
          return { success: true };
        }

        // Mapeia os erros
        let errorMessage = 'Autenticação falhou';
        if (result.error === 'user_cancel' || result.error === 'app_cancel') {
          errorMessage = 'Autenticação cancelada';
        } else if (result.error === 'authentication_failed') {
          errorMessage = 'Falha na autenticação';
        } else if (result.error === 'not_enrolled') {
          errorMessage = 'Biometria não configurada no dispositivo';
        } else if (result.error === 'not_available') {
          errorMessage = 'Biometria não disponível';
        }

        return { success: false, error: errorMessage };
      } catch (error) {
        console.error('[useBiometricAuth] Erro na autenticação:', error);
        return {
          success: false,
          error: 'Erro ao autenticar. Tente novamente.',
        };
      }
    },
    [isAvailable]
  );

  // Função para habilitar/desabilitar biometria
  const setEnabled = useCallback(async (enabled: boolean): Promise<void> => {
    if (enabled && !isAvailable) {
      throw new Error('Biometria não disponível neste dispositivo');
    }

    // Se está habilitando, autentica primeiro
    if (enabled) {
      const result = await authenticate('Confirme para habilitar biometria');
      if (!result.success) {
        throw new Error(result.error || 'Autenticação necessária');
      }
    }

    await SecureStorage.setBoolean(StorageKeys.BIOMETRIC_ENABLED, enabled);
    setIsEnabled(enabled);
  }, [isAvailable, authenticate]);

  // Nome amigável do tipo de biometria
  const biometricTypeName = (() => {
    switch (biometricType) {
      case 'facial':
        return 'Face ID';
      case 'fingerprint':
        return 'Impressão Digital';
      case 'iris':
        return 'Reconhecimento de Íris';
      default:
        return 'Biometria';
    }
  })();

  return {
    isAvailable,
    isEnabled,
    biometricType,
    loading,
    authenticate,
    setEnabled,
    biometricTypeName,
  };
}

export default useBiometricAuth;
