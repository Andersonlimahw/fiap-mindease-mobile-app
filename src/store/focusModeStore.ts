import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AmbientSound } from '@app/domain/entities/FocusSession';
import { DEFAULT_FOCUS_SETTINGS } from '@app/domain/entities/FocusSession';
import { zustandSecureStorage } from '@app/infrastructure/storage/SecureStorage';
import { useDIStore } from './diStore';
import { TOKENS } from '@app/core/di/container';
import type { UserRepository } from '@app/domain/repositories/UserRepository';
import { useAuthStore } from './authStore';

type FocusModeState = {
  // Active state
  isActive: boolean;
  timeLeft: number; // seconds
  isRunning: boolean;

  // Settings
  duration: number; // minutes
  ambientSound: AmbientSound;
  dimBrightness: boolean;
  blockNotifications: boolean;

  // Actions
  activate: () => void;
  deactivate: () => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  setDuration: (minutes: number) => void;
  setAmbientSound: (sound: AmbientSound) => void;
  setDimBrightness: (dim: boolean) => void;
  setBlockNotifications: (block: boolean) => void;
  syncWithFirebase: () => Promise<void>;
  updateSettings: (settings: any) => void;
};

const STORAGE_KEY = '@mindease/focus-mode:v1';

const getRepo = () => useDIStore.getState().di.resolve<UserRepository>(TOKENS.UserRepository);

export const useFocusModeStore = create<FocusModeState>()(
  persist(
    (set, get) => ({
      // Initial state
      isActive: false,
      timeLeft: DEFAULT_FOCUS_SETTINGS.duration * 60,
      isRunning: false,
      duration: DEFAULT_FOCUS_SETTINGS.duration,
      ambientSound: DEFAULT_FOCUS_SETTINGS.ambientSound,
      dimBrightness: DEFAULT_FOCUS_SETTINGS.dimBrightness,
      blockNotifications: DEFAULT_FOCUS_SETTINGS.blockNotifications,

      syncWithFirebase: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        
        const repo = getRepo();
        const remoteSettings = await repo.getSettings(user.id);
        if (remoteSettings?.focusMode) {
          set(remoteSettings.focusMode);
          get().reset();
        }
      },

      updateSettings: (newSettings: any) => {
        set(newSettings);
        
        // Sync with Firebase
        const user = useAuthStore.getState().user;
        if (user) {
          const updated = {
            duration: get().duration,
            ambientSound: get().ambientSound,
            dimBrightness: get().dimBrightness,
            blockNotifications: get().blockNotifications,
          };
          getRepo().saveSettings(user.id, { focusMode: updated }).catch(console.error);
        }
      },

      activate: () => {
        const { duration } = get();
        set({
          isActive: true,
          timeLeft: duration * 60,
          isRunning: false,
        });
      },

      deactivate: () => {
        set({
          isActive: false,
          isRunning: false,
        });
      },

      start: () => set({ isRunning: true }),

      pause: () => set({ isRunning: false }),

      reset: () => {
        const { duration } = get();
        set({
          timeLeft: duration * 60,
          isRunning: false,
        });
      },

      tick: () => {
        const { timeLeft, isRunning } = get();

        if (!isRunning || timeLeft <= 0) return;

        const newTimeLeft = timeLeft - 1;

        if (newTimeLeft <= 0) {
          // Session complete
          get().deactivate();
        } else {
          set({ timeLeft: newTimeLeft });
        }
      },

      setDuration: (minutes: number) => {
        get().updateSettings({
          duration: minutes,
          timeLeft: minutes * 60,
        });
      },

      setAmbientSound: (sound: AmbientSound) => {
        get().updateSettings({ ambientSound: sound });
      },

      setDimBrightness: (dim: boolean) => {
        get().updateSettings({ dimBrightness: dim });
      },

      setBlockNotifications: (block: boolean) => {
        get().updateSettings({ blockNotifications: block });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => zustandSecureStorage),
      partialize: (state) => ({
        duration: state.duration,
        ambientSound: state.ambientSound,
        dimBrightness: state.dimBrightness,
        blockNotifications: state.blockNotifications,
      }),
    }
  )
);

// ============================================
// SELECTORS (optimized for performance)
// ============================================

export const useFocusIsActive = () => useFocusModeStore((s) => s.isActive);
export const useFocusTimeLeft = () => useFocusModeStore((s) => s.timeLeft);
export const useFocusIsRunning = () => useFocusModeStore((s) => s.isRunning);

export const useFocusSettings = () =>
  useFocusModeStore((s) => ({
    duration: s.duration,
    ambientSound: s.ambientSound,
    dimBrightness: s.dimBrightness,
    blockNotifications: s.blockNotifications,
  }));

export const useFocusActions = () =>
  useFocusModeStore((s) => ({
    activate: s.activate,
    deactivate: s.deactivate,
    start: s.start,
    pause: s.pause,
    reset: s.reset,
    tick: s.tick,
    setDuration: s.setDuration,
    setAmbientSound: s.setAmbientSound,
    setDimBrightness: s.setDimBrightness,
    setBlockNotifications: s.setBlockNotifications,
  }));
