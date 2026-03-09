import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AccessibilitySettings,
  ColorBlindMode,
} from '@app/domain/entities/AccessibilitySettings';
import { DEFAULT_ACCESSIBILITY_SETTINGS } from '@app/domain/entities/AccessibilitySettings';
import { zustandSecureStorage } from '@app/infrastructure/storage/SecureStorage';
import { useDIStore } from './diStore';
import { TOKENS } from '@app/core/di/container';
import type { UserRepository } from '@app/domain/repositories/UserRepository';
import { useAuthStore } from './authStore';

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
  syncWithFirebase: () => Promise<void>;
};

const STORAGE_KEY = '@mindease/accessibility:v1';

const getRepo = () => useDIStore.getState().di.resolve<UserRepository>(TOKENS.UserRepository);

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_ACCESSIBILITY_SETTINGS,

      syncWithFirebase: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        
        const repo = getRepo();
        const remoteSettings = await repo.getSettings(user.id);
        if (remoteSettings?.accessibility) {
          set({ settings: remoteSettings.accessibility });
        }
      },

      updateSettings: (newSettings: Partial<AccessibilitySettings>) => {
        set((state) => {
          const updated = { ...state.settings, ...newSettings };
          
          // Background sync
          const user = useAuthStore.getState().user;
          if (user) {
            getRepo().saveSettings(user.id, { accessibility: updated }).catch(console.error);
          }
          
          return { settings: updated };
        });
      },

      resetSettings: () => {
        const updated = DEFAULT_ACCESSIBILITY_SETTINGS;
        set({ settings: updated });
        
        const user = useAuthStore.getState().user;
        if (user) {
          getRepo().saveSettings(user.id, { accessibility: updated }).catch(console.error);
        }
      },

      setFontSize: (size: number) => {
        get().updateSettings({ fontSize: size });
      },

      setLineHeight: (height: number) => {
        get().updateSettings({ lineHeight: height });
      },

      setLetterSpacing: (spacing: number) => {
        get().updateSettings({ letterSpacing: spacing });
      },

      setReduceMotion: (reduce: boolean) => {
        get().updateSettings({ reduceMotion: reduce });
      },

      setHighContrast: (contrast: boolean) => {
        get().updateSettings({ highContrast: contrast });
      },

      setColorBlindMode: (mode: ColorBlindMode) => {
        get().updateSettings({ colorBlindMode: mode });
      },

      setHapticFeedback: (enabled: boolean) => {
        get().updateSettings({ hapticFeedback: enabled });
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
