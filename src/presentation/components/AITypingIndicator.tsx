import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@app/presentation/theme/theme';

interface AITypingIndicatorProps {
  visible: boolean;
  source?: string;
}

/**
 * Indicador de digitação animado
 * Mostra que a IA está processando a resposta
 */
export function AITypingIndicator({ visible, source }: AITypingIndicatorProps) {
  const theme = useTheme();
  const [dotAnimations] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]);

  useEffect(() => {
    if (!visible) return;

    const animations = dotAnimations.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: false,
            }),
          ]),
          Animated.delay(400),
        ])
      )
    );

    Animated.parallel(animations).start();

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [visible, dotAnimations]);

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.dotsContainer}>
        {dotAnimations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: theme.colors.primary,
                opacity: anim,
                transform: [
                  {
                    scale: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.5],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
      {source && (
        <Text style={[styles.text, { color: theme.colors.muted }]}>
          Processando via {source}...
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
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
  },
});
