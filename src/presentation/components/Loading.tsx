import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme';

type LoadingProps = {
  /** Mensagem opcional a exibir */
  message?: string;
  /** Tamanho do indicador */
  size?: 'small' | 'large';
  /** Se deve ocupar toda a tela */
  fullScreen?: boolean;
};

/**
 * Componente de Loading reutilizável
 *
 * @example
 * // Loading simples
 * <Loading />
 *
 * // Loading com mensagem
 * <Loading message="Carregando dados..." />
 *
 * // Loading em tela cheia
 * <Loading fullScreen message="Aguarde..." />
 */
export function Loading({
  message,
  size = 'large',
  fullScreen = true,
}: LoadingProps) {
  const theme = useTheme();

  const containerStyle = fullScreen
    ? [styles.fullScreen, { backgroundColor: theme.colors.background }]
    : styles.inline;

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message && (
        <Text style={[styles.message, { color: theme.colors.text }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inline: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 12,
    fontSize: 14,
  },
});

export default Loading;
