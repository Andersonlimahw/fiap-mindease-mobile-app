/**
 * PomodoroSession Entity - Domain Layer
 * Represents the Pomodoro timer state and settings
 */

export type PomodoroMode = 'focus' | 'short-break' | 'long-break';

export interface PomodoroSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsUntilLongBreak: number;
}

export interface PomodoroStats {
  completedSessions: number;
  totalFocusTime: number; // seconds
}

export interface PomodoroSession {
  id: string;
  userId: string;
  mode: PomodoroMode;
  duration: number; // seconds
  completedAt: number;
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
};

export const MODE_LABELS: Record<PomodoroMode, string> = {
  focus: 'Focus',
  'short-break': 'Short Break',
  'long-break': 'Long Break',
};
