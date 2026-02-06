import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  PomodoroMode,
  PomodoroSettings,
} from '@app/domain/entities/PomodoroSession';
import { DEFAULT_POMODORO_SETTINGS } from '@app/domain/entities/PomodoroSession';
import { zustandSecureStorage } from '@app/infrastructure/storage/SecureStorage';

type PomodoroState = {
  // Timer state
  mode: PomodoroMode;
  timeLeft: number; // seconds
  isRunning: boolean;

  // Stats
  completedSessions: number;
  totalFocusTime: number; // seconds

  // Settings
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;

  // Actions
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  tick: () => void;
  setMode: (mode: PomodoroMode) => void;
  updateSettings: (settings: Partial<PomodoroSettings>) => void;
  resetStats: () => void;
};

const STORAGE_KEY = '@mindease/pomodoro:v1';

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'focus',
      timeLeft: DEFAULT_POMODORO_SETTINGS.focusDuration * 60,
      isRunning: false,
      completedSessions: 0,
      totalFocusTime: 0,
      focusDuration: DEFAULT_POMODORO_SETTINGS.focusDuration,
      shortBreakDuration: DEFAULT_POMODORO_SETTINGS.shortBreakDuration,
      longBreakDuration: DEFAULT_POMODORO_SETTINGS.longBreakDuration,
      sessionsUntilLongBreak: DEFAULT_POMODORO_SETTINGS.sessionsUntilLongBreak,

      start: () => set({ isRunning: true }),

      pause: () => set({ isRunning: false }),

      reset: () => {
        const { mode, focusDuration, shortBreakDuration, longBreakDuration } =
          get();
        const duration =
          mode === 'focus'
            ? focusDuration
            : mode === 'short-break'
            ? shortBreakDuration
            : longBreakDuration;

        set({
          timeLeft: duration * 60,
          isRunning: false,
        });
      },

      skip: () => {
        const { mode, completedSessions, sessionsUntilLongBreak } = get();

        if (mode === 'focus') {
          const newSessions = completedSessions + 1;
          const shouldLongBreak = newSessions % sessionsUntilLongBreak === 0;

          set({
            mode: shouldLongBreak ? 'long-break' : 'short-break',
            timeLeft: shouldLongBreak
              ? get().longBreakDuration * 60
              : get().shortBreakDuration * 60,
            completedSessions: newSessions,
            isRunning: false,
          });
        } else {
          set({
            mode: 'focus',
            timeLeft: get().focusDuration * 60,
            isRunning: false,
          });
        }
      },

      tick: () => {
        const { timeLeft, isRunning, mode } = get();

        if (!isRunning || timeLeft <= 0) return;

        const newTimeLeft = timeLeft - 1;

        // Track focus time
        if (mode === 'focus') {
          set((state) => ({
            totalFocusTime: state.totalFocusTime + 1,
          }));
        }

        if (newTimeLeft <= 0) {
          // Timer completed - skip to next mode
          get().skip();
        } else {
          set({ timeLeft: newTimeLeft });
        }
      },

      setMode: (mode: PomodoroMode) => {
        const { focusDuration, shortBreakDuration, longBreakDuration } = get();
        const duration =
          mode === 'focus'
            ? focusDuration
            : mode === 'short-break'
            ? shortBreakDuration
            : longBreakDuration;

        set({
          mode,
          timeLeft: duration * 60,
          isRunning: false,
        });
      },

      updateSettings: (settings: Partial<PomodoroSettings>) => {
        set(settings);

        // Reset timer with new duration if not running
        const { mode, isRunning } = get();
        if (!isRunning) {
          get().reset();
        }
      },

      resetStats: () => {
        set({
          completedSessions: 0,
          totalFocusTime: 0,
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => zustandSecureStorage),
      partialize: (state) => ({
        completedSessions: state.completedSessions,
        totalFocusTime: state.totalFocusTime,
        focusDuration: state.focusDuration,
        shortBreakDuration: state.shortBreakDuration,
        longBreakDuration: state.longBreakDuration,
        sessionsUntilLongBreak: state.sessionsUntilLongBreak,
      }),
    }
  )
);

// ============================================
// SELECTORS (optimized for performance)
// ============================================

export const usePomodoroMode = () => usePomodoroStore((s) => s.mode);
export const usePomodoroTimeLeft = () => usePomodoroStore((s) => s.timeLeft);
export const usePomodoroIsRunning = () => usePomodoroStore((s) => s.isRunning);
export const usePomodoroStats = () =>
  usePomodoroStore((s) => ({
    completedSessions: s.completedSessions,
    totalFocusTime: s.totalFocusTime,
  }));

export const usePomodoroSettings = () =>
  usePomodoroStore((s) => ({
    focusDuration: s.focusDuration,
    shortBreakDuration: s.shortBreakDuration,
    longBreakDuration: s.longBreakDuration,
    sessionsUntilLongBreak: s.sessionsUntilLongBreak,
  }));

export const usePomodoroActions = () =>
  usePomodoroStore((s) => ({
    start: s.start,
    pause: s.pause,
    reset: s.reset,
    skip: s.skip,
    tick: s.tick,
    setMode: s.setMode,
    updateSettings: s.updateSettings,
    resetStats: s.resetStats,
  }));

// Helper to format time
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Helper to format total time
export const formatTotalTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};
