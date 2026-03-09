import { useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import type { PomodoroMode } from '@app/domain/entities/PomodoroSession';
import { POMODORO_ALERT_SOUND } from '@app/domain/entities/PomodoroSession';

export function usePomodoroAlert(mode: PomodoroMode) {
  const previousModeRef = useRef<PomodoroMode>(mode);
  const soundRef = useRef<Audio.Sound | null>(null);

  const playAlert = useCallback(async () => {
    try {
      // Unload previous sound if exists
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: POMODORO_ALERT_SOUND },
        { shouldPlay: true, volume: 1.0 }
      );
      
      soundRef.current = sound;
    } catch (error) {
      console.error('Failed to play Pomodoro alert sound', error);
    }
  }, []);

  useEffect(() => {
    // When mode changes, it means a timer session has ended (or user manually skipped)
    if (previousModeRef.current !== mode) {
      playAlert();
      previousModeRef.current = mode;
    }
  }, [mode, playAlert]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);
}
