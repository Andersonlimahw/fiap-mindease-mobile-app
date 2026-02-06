# Focus Mode Feature

## Overview

A distraction-free mode designed to help users concentrate during work sessions, featuring ambient sounds, notification blocking, and visual adjustments.

## Architecture

### Domain Layer

#### Entity: FocusSession

```typescript
// src/domain/entities/FocusSession.ts

export type AmbientSound =
  | 'none'
  | 'rain'
  | 'forest'
  | 'ocean'
  | 'cafe'
  | 'white-noise';

export interface FocusSettings {
  duration: number;           // minutes
  ambientSound: AmbientSound;
  dimBrightness: boolean;
  blockNotifications: boolean;
}

export interface FocusSession {
  id: string;
  userId: string;
  duration: number;           // minutes planned
  actualDuration: number;     // seconds completed
  ambientSound: AmbientSound;
  startedAt: number;
  endedAt?: number;
}
```

### Store

```typescript
// src/store/focusModeStore.ts

interface FocusModeState {
  // Active state
  isActive: boolean;
  timeLeft: number;           // seconds
  isRunning: boolean;

  // Settings
  duration: number;           // minutes
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
}
```

### Presentation

#### Screen: FocusModeScreen

Location: `src/presentation/screens/FocusMode/FocusModeScreen.tsx`

Components:
- FocusTimer (large countdown display)
- FocusControls (activate/deactivate, pause/resume)
- AmbientSoundPicker (sound selection grid)
- FocusSettingsPanel (duration, brightness, notifications)
- ActiveFocusOverlay (minimized view during focus)

## Ambient Sounds

Sound files stored in `assets/sounds/ambient/`:
- rain.mp3
- forest.mp3
- ocean.mp3
- cafe.mp3
- white-noise.mp3

Implementation using `expo-av`:

```typescript
import { Audio } from 'expo-av';

class AmbientSoundManager {
  private sound: Audio.Sound | null = null;

  async play(soundType: AmbientSound) {
    if (soundType === 'none') {
      await this.stop();
      return;
    }

    const soundFiles = {
      'rain': require('@assets/sounds/ambient/rain.mp3'),
      'forest': require('@assets/sounds/ambient/forest.mp3'),
      // ...
    };

    await this.stop();
    const { sound } = await Audio.Sound.createAsync(soundFiles[soundType], {
      isLooping: true,
      volume: 0.5,
    });
    this.sound = sound;
    await sound.playAsync();
  }

  async stop() {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }
}
```

## Brightness Control

Using `expo-brightness` for screen dimming:

```typescript
import * as Brightness from 'expo-brightness';

const dimScreen = async (dim: boolean) => {
  const { status } = await Brightness.requestPermissionsAsync();
  if (status === 'granted') {
    await Brightness.setSystemBrightnessAsync(dim ? 0.3 : 1.0);
  }
};
```

## Notification Blocking

Using Do Not Disturb where available, or app-level notification filtering.

## User Stories

1. As a user, I can activate focus mode for a set duration
2. As a user, I can select ambient sounds to play during focus
3. As a user, I can dim the screen during focus sessions
4. As a user, I can block notifications during focus
5. As a user, I see a timer countdown during focus
6. As a user, I can pause and resume focus sessions
7. As a user, I'm notified when focus session ends

## UI/UX Considerations

- Full-screen immersive mode during active focus
- Gentle animations to reduce distraction
- Quick access to pause/stop without full UI
- Visual feedback for active settings

## Migration Notes

Web source: `.tmp/fiap-mindease-frontend-web/src/stores/useFocusModeStore.ts`

Key differences:
- Replace `document.body.classList` with React Native state-based styling
- Use `expo-av` for audio instead of Web Audio API
- Use `expo-brightness` for screen control
- Handle background audio properly for iOS/Android
