import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native';
import type { AIResponseMetadata } from '@app/types/ai';
import { AIResponseSource } from '@app/types/ai';
import { useTheme } from '@app/presentation/theme/theme';

interface AIStatusIndicatorProps {
  metadata?: AIResponseMetadata;
  compact?: boolean;
}

/**
 * Indicador visual da origem da resposta de IA
 * Mostra: local (torch), cloud, demo, etc
 */
export function AIStatusIndicator({
  metadata,
  compact = false,
}: AIStatusIndicatorProps) {
  const theme = useTheme();

  if (!metadata) {
    return null;
  }

  const getSourceLabel = (source: AIResponseSource): string => {
    switch (source) {
      case AIResponseSource.LOCAL:
        return 'Local';
      case AIResponseSource.LOCAL_CACHED:
        return 'Cached';
      case AIResponseSource.OLLAMA:
        return 'Local Server';
      case AIResponseSource.CLOUD:
        return 'Cloud';
      case AIResponseSource.DEMO:
        return 'Demo';
      default:
        return 'Unknown';
    }
  };

  const getSourceColor = (source: AIResponseSource): string => {
    switch (source) {
      case AIResponseSource.LOCAL:
        return '#00DD88'; // Green - local/fast
      case AIResponseSource.LOCAL_CACHED:
        return '#00AA88'; // Teal - cached
      case AIResponseSource.OLLAMA:
        return '#0088FF'; // Blue - local dev
      case AIResponseSource.CLOUD:
        return '#FF8800'; // Orange - cloud
      case AIResponseSource.DEMO:
        return '#888888'; // Gray - demo fallback
      default:
        return '#666666';
    }
  };

  const sourceLabel = getSourceLabel(metadata.source);
  const sourceColor = getSourceColor(metadata.source);

  if (compact) {
    return (
      <View style={[styles.compactContainer, { borderLeftColor: sourceColor }]}>
        <Text style={[styles.compactText, { color: sourceColor }]}>
          {sourceLabel} • {metadata.latencyMs}ms
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View
        style={[
          styles.dot,
          {
            backgroundColor: sourceColor,
          },
        ]}
      />
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {sourceLabel}
        </Text>
        {metadata.latencyMs > 0 && (
          <Text style={[styles.latency, { color: theme.colors.muted }]}>
            {metadata.latencyMs}ms
            {metadata.model && ` • ${metadata.model}`}
          </Text>
        )}
      </View>
      {metadata.cached && (
        <Text style={[styles.badge, { color: sourceColor }]}>
          Cached
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  latency: {
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  compactContainer: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    marginVertical: 4,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
