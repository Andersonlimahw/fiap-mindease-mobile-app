import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import type { AmbientSound } from '@app/domain/entities/FocusSession';
import { SOUND_ASSETS } from '@app/domain/entities/FocusSession';

export function useAmbientSound(soundType: AmbientSound, isPlaying: boolean) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const loadSound = useCallback(async (type: Exclude<AmbientSound, 'none'>) => {
    try {
      setIsLoading(true);

      // Stop and unload previous sound if exists
      if (soundRef.current) {
        const oldSound = soundRef.current;
        soundRef.current = null;
        setSound(null);
        await oldSound.unloadAsync().catch(() => { }); // Silent catch for old sound cleanup
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: SOUND_ASSETS[type] },
        { shouldPlay: isPlaying, isLooping: true, volume: 1.0 }
      );

      soundRef.current = newSound;
      setSound(newSound);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load sound', error);
      setIsLoading(false);
    }
  }, [isPlaying]);

  const stopSound = useCallback(async () => {
    const currentSound = soundRef.current;
    if (currentSound) {
      try {
        // Clear reference FIRST to prevent race conditions with effects
        soundRef.current = null;
        setSound(null);
        await currentSound.unloadAsync();
      } catch (error) {
        // 'Seeking interrupted' is a common (and often harmless) error in expo-av 
        // when a sound is unloaded while it's still preparing or stopping.
        const isSeekingInterrupted = error instanceof Error && error.message.includes('Seeking interrupted');
        if (!isSeekingInterrupted) {
          console.error('Failed to stop sound', error);
        }
      }
    }
  }, []);

  // Update playback status when isPlaying changes
  useEffect(() => {
    const updatePlayback = async () => {
      if (soundRef.current) {
        try {
          if (isPlaying) {
            await soundRef.current.playAsync();
          } else {
            await soundRef.current.pauseAsync();
          }
        } catch (error) {
          console.error('Failed to update playback status', error);
        }
      }
    };

    updatePlayback();
  }, [isPlaying]);

  // Load sound when soundType changes
  useEffect(() => {
    if (soundType === 'none') {
      stopSound();
    } else {
      loadSound(soundType as Exclude<AmbientSound, 'none'>);
    }

    return () => {
      stopSound();
    };
  }, [soundType, stopSound, loadSound]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      const currentSound = soundRef.current;
      if (currentSound) {
        soundRef.current = null;
        currentSound.unloadAsync().catch(() => { });
      }
    };
  }, []);

  return { isLoading };
}
