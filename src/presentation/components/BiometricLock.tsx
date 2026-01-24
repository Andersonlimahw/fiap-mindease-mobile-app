import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { Loading } from './Loading';

type BiometricLockProps = {
  /** Conteúdo a ser exibido quando autenticado */
  children: React.ReactNode;
  /** Se deve exigir autenticação biométrica */
  requireAuth?: boolean;
  /** Mensagem personalizada */
  message?: string;
  /** Callback quando autenticado com sucesso */
  onAuthenticated?: () => void;
  /** Callback quando falhar */
  onAuthFailed?: (error: string) => void;
};

/**
 * Componente que protege conteúdo com autenticação biométrica
 *
 * @example
 * <BiometricLock requireAuth message="Confirme para ver saldo">
 *   <BalanceDisplay />
 * </BiometricLock>
 */
export function BiometricLock({
  children,
  requireAuth = true,
  message = 'Confirme sua identidade',
  onAuthenticated,
  onAuthFailed,
}: BiometricLockProps) {
  const theme = useTheme();
  const {
    isAvailable,
    isEnabled,
    loading,
    authenticate,
    biometricTypeName,
  } = useBiometricAuth();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Auto-autentica se biometria está habilitada
  useEffect(() => {
    if (!loading && isAvailable && isEnabled && requireAuth && !isAuthenticated) {
      handleAuthenticate();
    }
  }, [loading, isAvailable, isEnabled, requireAuth]);

  const handleAuthenticate = async () => {
    setAuthError(null);
    const result = await authenticate(message);

    if (result.success) {
      setIsAuthenticated(true);
      onAuthenticated?.();
    } else {
      setAuthError(result.error || 'Falha na autenticação');
      onAuthFailed?.(result.error || 'Falha na autenticação');
    }
  };

  // Loading
  if (loading) {
    return <Loading message="Verificando segurança..." />;
  }

  // Se biometria não está disponível ou habilitada, mostra conteúdo
  if (!isAvailable || !isEnabled || !requireAuth) {
    return <>{children}</>;
  }

  // Se já autenticado, mostra conteúdo
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Tela de bloqueio
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.colors.primary + '20' },
          ]}
        >
          <MaterialIcons
            name="fingerprint"
            size={64}
            color={theme.colors.primary}
          />
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          Autenticação Necessária
        </Text>

        <Text style={[styles.message, { color: theme.colors.muted }]}>
          Use {biometricTypeName} para continuar
        </Text>

        {authError && (
          <Text style={[styles.error, { color: theme.colors.danger }]}>
            {authError}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleAuthenticate}
          activeOpacity={0.8}
        >
          <MaterialIcons name="fingerprint" size={24} color="#FFFFFF" />
          <Text style={styles.buttonText}>Autenticar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BiometricLock;
