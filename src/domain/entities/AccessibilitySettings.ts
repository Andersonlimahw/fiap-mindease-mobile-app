/**
 * AccessibilitySettings Entity - Domain Layer
 * Represents user accessibility preferences
 */

export type ColorBlindMode =
  | 'none'
  | 'protanopia' // Red-blind
  | 'deuteranopia' // Green-blind
  | 'tritanopia'; // Blue-blind

export interface AccessibilitySettings {
  // Typography
  fontSize: number; // 12-24px
  lineHeight: number; // 1.2-2.0
  letterSpacing: number; // 0-0.2em

  // Motion & Visual
  reduceMotion: boolean;
  highContrast: boolean;
  colorBlindMode: ColorBlindMode;

  // Interaction
  hapticFeedback: boolean;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  fontSize: 16,
  lineHeight: 1.5,
  letterSpacing: 0,
  reduceMotion: false,
  highContrast: false,
  colorBlindMode: 'none',
  hapticFeedback: true,
};

export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 24;
export const LINE_HEIGHT_MIN = 1.2;
export const LINE_HEIGHT_MAX = 2.0;
export const LETTER_SPACING_MIN = 0;
export const LETTER_SPACING_MAX = 0.2;

export const COLOR_BLIND_MODES: { id: ColorBlindMode; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'protanopia', label: 'Protanopia' },
  { id: 'deuteranopia', label: 'Deuteranopia' },
  { id: 'tritanopia', label: 'Tritanopia' },
];
