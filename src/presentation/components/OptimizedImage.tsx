import React, { useMemo } from 'react';
import { Image, ImageProps, ImageContentFit } from 'expo-image';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/theme';

type OptimizedImageProps = Omit<ImageProps, 'source'> & {
  /** URI da imagem */
  uri?: string | null;
  /** Largura da imagem */
  width?: number;
  /** Altura da imagem */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Se deve mostrar placeholder durante carregamento */
  showPlaceholder?: boolean;
  /** Cor de fundo do placeholder */
  placeholderColor?: string;
  /** Prioridade de carregamento */
  priority?: 'low' | 'normal' | 'high';
  /** Se deve fazer prefetch */
  prefetch?: boolean;
  /** Modo de ajuste do conteúdo */
  contentFit?: ImageContentFit;
  /** Estilo do container */
  containerStyle?: ViewStyle;
};

/**
 * Componente de imagem otimizado com cache, lazy loading e placeholders
 *
 * Usa expo-image que oferece:
 * - Cache em disco e memória
 * - Lazy loading nativo
 * - Transições suaves
 * - Suporte a blurhash/thumbhash
 * - Prefetch de imagens
 *
 * @example
 * <OptimizedImage
 *   uri={user.photoUrl}
 *   width={100}
 *   height={100}
 *   borderRadius={50}
 * />
 */
export function OptimizedImage({
  uri,
  width = 100,
  height = 100,
  borderRadius = 0,
  showPlaceholder = true,
  placeholderColor,
  priority = 'normal',
  prefetch = false,
  contentFit = 'cover',
  containerStyle,
  style,
  ...props
}: OptimizedImageProps) {
  const theme = useTheme();
  const bgColor = placeholderColor || theme.colors.surface;

  const imageStyle = useMemo(
    () => [
      {
        width,
        height,
        borderRadius,
        backgroundColor: showPlaceholder ? bgColor : 'transparent',
      },
      style,
    ],
    [width, height, borderRadius, showPlaceholder, bgColor, style]
  );

  // Se não há URI, mostra placeholder
  if (!uri) {
    return (
      <View
        style={[
          styles.placeholder,
          { width, height, borderRadius, backgroundColor: bgColor },
          containerStyle,
        ]}
      />
    );
  }

  return (
    <Image
      source={{ uri }}
      style={imageStyle}
      contentFit={contentFit}
      transition={200}
      cachePolicy="memory-disk"
      priority={priority}
      placeholder={showPlaceholder ? { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' } : undefined}
      placeholderContentFit="cover"
      {...props}
    />
  );
}

/**
 * Prefetch de imagens para carregamento antecipado
 *
 * @example
 * // Prefetch de avatares
 * prefetchImages(['https://...', 'https://...']);
 */
export async function prefetchImages(uris: string[]): Promise<void> {
  try {
    await Promise.all(uris.filter(Boolean).map((uri) => Image.prefetch(uri)));
  } catch (error) {
    console.warn('[OptimizedImage] Erro no prefetch:', error);
  }
}

/**
 * Limpa o cache de imagens
 */
export async function clearImageCache(): Promise<void> {
  try {
    await Image.clearDiskCache();
    await Image.clearMemoryCache();
  } catch (error) {
    console.warn('[OptimizedImage] Erro ao limpar cache:', error);
  }
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OptimizedImage;
