import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AccessibilitySettings,
  ColorBlindMode,
} from '@app/domain/entities/AccessibilitySettings';
import { DEFAULT_ACCESSIBILITY_SETTINGS } from '@app/domain/entities/AccessibilitySettings';
import { zustandSecureStorage } from '@app/infrastructure/storage/SecureStorage';

type AccessibilityState = {
  settings: AccessibilitySettings;

  // Actions
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setLetterSpacing: (spacing: number) => void;
  setReduceMotion: (reduce: boolean) => void;
  setHighContrast: (contrast: boolean) => void;
  setColorBlindMode: (mode: ColorBlindMode) => void;
  setHapticFeedback: (enabled: boolean) => void;
};

const STORAGE_KEY = '@mindease/accessibility:v1';

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_ACCESSIBILITY_SETTINGS,

      updateSettings: (newSettings: Partial<AccessibilitySettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      resetSettings: () => {
        set({ settings: DEFAULT_ACCESSIBILITY_SETTINGS });
      },

      setFontSize: (size: number) => {
        set((state) => ({
          settings: { ...state.settings, fontSize: size },
        }));
      },

      setLineHeight: (height: number) => {
        set((state) => ({
          settings: { ...state.settings, lineHeight: height },
        }));
      },

      setLetterSpacing: (spacing: number) => {
        set((state) => ({
          settings: { ...state.settings, letterSpacing: spacing },
        }));
      },

      setReduceMotion: (reduce: boolean) => {
        set((state) => ({
          settings: { ...state.settings, reduceMotion: reduce },
        }));
      },

      setHighContrast: (contrast: boolean) => {
        set((state) => ({
          settings: { ...state.settings, highContrast: contrast },
        }));
      },

      setColorBlindMode: (mode: ColorBlindMode) => {
        set((state) => ({
          settings: { ...state.settings, colorBlindMode: mode },
        }));
      },

      setHapticFeedback: (enabled: boolean) => {
        set((state) => ({
          settings: { ...state.settings, hapticFeedback: enabled },
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => zustandSecureStorage),
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);

// ============================================
// SELECTORS (optimized for performance)
// ============================================

export const useAccessibilitySettings = () =>
  useAccessibilityStore((s) => s.settings);

export const useFontSize = () =>
  useAccessibilityStore((s) => s.settings.fontSize);

export const useReduceMotion = () =>
  useAccessibilityStore((s) => s.settings.reduceMotion);

export const useHighContrast = () =>
  useAccessibilityStore((s) => s.settings.highContrast);

export const useColorBlindMode = () =>
  useAccessibilityStore((s) => s.settings.colorBlindMode);

export const useHapticFeedback = () =>
  useAccessibilityStore((s) => s.settings.hapticFeedback);

export const useAccessibilityActions = () =>
  useAccessibilityStore((s) => ({
    updateSettings: s.updateSettings,
    resetSettings: s.resetSettings,
    setFontSize: s.setFontSize,
    setLineHeight: s.setLineHeight,
    setLetterSpacing: s.setLetterSpacing,
    setReduceMotion: s.setReduceMotion,
    setHighContrast: s.setHighContrast,
    setColorBlindMode: s.setColorBlindMode,
    setHapticFeedback: s.setHapticFeedback,
  }));
