/**
 * FocusSession Entity - Domain Layer
 * Represents the Focus Mode state and settings
 */

export type AmbientSound =
  | 'none'
  | 'rain'
  | 'forest'
  | 'ocean'
  | 'cafe'
  | 'white-noise';

export interface FocusSettings {
  duration: number; // minutes
  ambientSound: AmbientSound;
  dimBrightness: boolean;
  blockNotifications: boolean;
}

export interface FocusSession {
  id: string;
  userId: string;
  duration: number; // minutes planned
  actualDuration: number; // seconds completed
  ambientSound: AmbientSound;
  startedAt: number;
  endedAt?: number;
}

export const DEFAULT_FOCUS_SETTINGS: FocusSettings = {
  duration: 25,
  ambientSound: 'none',
  dimBrightness: false,
  blockNotifications: true,
};

export const AMBIENT_SOUND_LABELS: Record<AmbientSound, string> = {
  none: 'None',
  rain: 'Rain',
  forest: 'Forest',
  ocean: 'Ocean',
  cafe: 'Cafe',
  'white-noise': 'White Noise',
};

export const AMBIENT_SOUND_ICONS: Record<AmbientSound, string> = {
  none: 'volume-off',
  rain: 'water-drop',
  forest: 'park',
  ocean: 'waves',
  cafe: 'local-cafe',
  'white-noise': 'graphic-eq',
};
