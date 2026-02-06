# Pomodoro Timer Feature

## Overview

Implementation of the Pomodoro Technique for time management, featuring customizable focus and break durations with automatic mode transitions.

## Architecture

### Domain Layer

#### Entity: PomodoroSession

```typescript
// src/domain/entities/PomodoroSession.ts

export type PomodoroMode = 'focus' | 'short-break' | 'long-break';

export interface PomodoroSettings {
  focusDuration: number;      // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number;  // minutes
  sessionsUntilLongBreak: number;
}

export interface PomodoroSession {
  id: string;
  userId: string;
  mode: PomodoroMode;
  duration: number;           // seconds
  completedAt: number;
}

export interface PomodoroStats {
  completedSessions: number;
  totalFocusTime: number;     // seconds
}
```

### Store

```typescript
// src/store/pomodoroStore.ts

interface PomodoroState {
  // Timer state
  mode: PomodoroMode;
  timeLeft: number;           // seconds
  isRunning: boolean;

  // Stats
  completedSessions: number;
  totalFocusTime: number;

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
}
```

### Presentation

#### Screen: PomodoroScreen

Location: `src/presentation/screens/Pomodoro/PomodoroScreen.tsx`

Components:
- TimerCircle (circular progress visualization)
- PomodoroControls (start/pause/reset buttons)
- ModeSelector (focus/short-break/long-break tabs)
- PomodoroStats (sessions count, total focus time)
- SettingsSheet (duration configuration)

## Timer Logic

```
Start in FOCUS mode (25 min default)
    ↓
When timer completes:
    - Play notification sound
    - Increment completedSessions
    - If completedSessions % sessionsUntilLongBreak === 0:
        → Switch to LONG-BREAK
    - Else:
        → Switch to SHORT-BREAK
    ↓
When break completes:
    - Play notification sound
    → Switch to FOCUS
```

## Default Values

- Focus Duration: 25 minutes
- Short Break: 5 minutes
- Long Break: 15 minutes
- Sessions Until Long Break: 4

## User Stories

1. As a user, I can start a focus timer
2. As a user, I can pause and resume the timer
3. As a user, I can reset the current timer
4. As a user, I can skip to the next mode
5. As a user, I can customize timer durations
6. As a user, I see my total focus time and sessions completed
7. As a user, I receive a sound notification when a timer ends

## Sound Notifications

Uses `expo-av` for audio playback:

```typescript
import { Audio } from 'expo-av';

const playNotificationSound = async () => {
  const { sound } = await Audio.Sound.createAsync(
    require('@assets/sounds/timer-complete.mp3')
  );
  await sound.playAsync();
};
```

## Background Timer

For background execution, consider using:
- `expo-background-fetch` for periodic updates
- `expo-notifications` for scheduled notifications

## Migration Notes

Web source: `.tmp/fiap-mindease-frontend-web/src/stores/usePomodoroStore.ts`

Key differences:
- Replace `Audio` Web API with `expo-av`
- Use `useEffect` with interval for tick (not interval in store)
- Consider background task support for iOS/Android
