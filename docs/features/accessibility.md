# Accessibility Feature

## Overview

Comprehensive accessibility settings following WCAG 2.2 AA guidelines, enabling users to customize their experience based on individual needs.

## Architecture

### Domain Layer

#### Entity: AccessibilitySettings

```typescript
// src/domain/entities/AccessibilitySettings.ts

export type ColorBlindMode =
  | 'none'
  | 'protanopia'    // Red-blind
  | 'deuteranopia'  // Green-blind
  | 'tritanopia';   // Blue-blind

export interface AccessibilitySettings {
  // Typography
  fontSize: number;           // 12-24px
  lineHeight: number;         // 1.2-2.0
  letterSpacing: number;      // 0-0.2em

  // Motion & Visual
  reduceMotion: boolean;
  highContrast: boolean;
  colorBlindMode: ColorBlindMode;

  // Interaction
  keyboardNavigation: boolean;
  screenReaderMode: boolean;
  hapticFeedback: boolean;    // Mobile-specific
}

export const defaultAccessibilitySettings: AccessibilitySettings = {
  fontSize: 16,
  lineHeight: 1.5,
  letterSpacing: 0,
  reduceMotion: false,
  highContrast: false,
  colorBlindMode: 'none',
  keyboardNavigation: true,
  screenReaderMode: false,
  hapticFeedback: true,
};
```

### Store

```typescript
// src/store/accessibilityStore.ts

interface AccessibilityState {
  settings: AccessibilitySettings;

  // Actions
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
  setFontSize: (size: number) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  toggleReduceMotion: () => void;
  toggleHighContrast: () => void;
}
```

### Presentation

#### Settings Integration

Location: `src/presentation/screens/User/UserScreen.tsx` or dedicated `AccessibilityScreen.tsx`

Components:
- FontSizeSlider (adjustable font size)
- LineHeightSlider
- ColorBlindModePicker (segmented control)
- ReduceMotionToggle
- HighContrastToggle
- HapticFeedbackToggle

## Implementation Details

### Font Size Application

Using React Native's `PixelRatio` and dynamic styles:

```typescript
import { PixelRatio } from 'react-native';

const useScaledFontSize = (baseSize: number) => {
  const { fontSize } = useAccessibilitySettings();
  const scale = fontSize / 16; // 16 is the base
  return PixelRatio.roundToNearestPixel(baseSize * scale);
};
```

### Reduce Motion

Disable animations when enabled:

```typescript
import { useReducedMotion } from 'react-native-reanimated';

const reduceMotion = useReducedMotion();
// Also check store setting

const animationDuration = reduceMotion ? 0 : 300;
```

### High Contrast Mode

Apply enhanced contrast colors:

```typescript
const getContrastColors = (baseColors: ThemeColors, highContrast: boolean) => {
  if (!highContrast) return baseColors;

  return {
    ...baseColors,
    text: '#000000',
    background: '#FFFFFF',
    primary: '#0000CC',
    border: '#000000',
    // Increase all contrast ratios to 7:1+
  };
};
```

### Color Blind Filters

Apply color transformations:

```typescript
const colorBlindTransforms: Record<ColorBlindMode, string> = {
  none: 'none',
  protanopia: 'matrix(0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0)',
  deuteranopia: 'matrix(0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0)',
  tritanopia: 'matrix(0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0)',
};

// Apply via color transformation or adjusted palette
```

### Haptic Feedback

Using `expo-haptics`:

```typescript
import * as Haptics from 'expo-haptics';

const useHaptic = () => {
  const { hapticFeedback } = useAccessibilitySettings();

  return {
    light: () => hapticFeedback && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    medium: () => hapticFeedback && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    success: () => hapticFeedback && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  };
};
```

### Screen Reader Support

Ensure all components have proper accessibility props:

```tsx
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Complete task"
  accessibilityHint="Double tap to mark this task as complete"
  accessibilityRole="button"
>
  <Text>Complete</Text>
</TouchableOpacity>
```

## User Stories

1. As a user, I can adjust the font size (12-24px)
2. As a user, I can adjust line height for better readability
3. As a user, I can enable high contrast mode
4. As a user, I can select a color blind mode
5. As a user, I can reduce motion/animations
6. As a user, I can toggle haptic feedback
7. As a user, my settings persist across sessions
8. As a user, I can reset to default settings

## WCAG 2.2 AA Compliance

- Color contrast ratio: 4.5:1 for normal text, 3:1 for large text
- Focus indicators visible on all interactive elements
- All images have alt text
- Touch targets minimum 44x44 points
- No time limits on interactions
- Motion can be disabled
- Text can be resized up to 200%

## Migration Notes

Web source: `.tmp/fiap-mindease-frontend-web/src/stores/useAccessibilityStore.ts`

Key differences:
- Replace CSS variables with React Native style application
- Use `expo-haptics` for haptic feedback (mobile-specific)
- Handle platform-specific accessibility APIs
- Integrate with system accessibility settings where possible
