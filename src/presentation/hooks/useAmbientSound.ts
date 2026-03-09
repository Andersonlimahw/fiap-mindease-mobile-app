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
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setSound(null);
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
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setSound(null);
      } catch (error) {
        console.error('Failed to stop sound', error);
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
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return { isLoading };
}
