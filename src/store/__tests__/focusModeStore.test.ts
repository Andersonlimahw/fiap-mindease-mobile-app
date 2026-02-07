/**
 * Unit Tests for focusModeStore
 * Tests Focus Mode state management and actions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useFocusModeStore } from '../focusModeStore';
import { DEFAULT_FOCUS_SETTINGS } from '@app/domain/entities/FocusSession';

describe('focusModeStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useFocusModeStore.setState({
      isActive: false,
      timeLeft: DEFAULT_FOCUS_SETTINGS.duration * 60,
      isRunning: false,
      duration: DEFAULT_FOCUS_SETTINGS.duration,
      ambientSound: DEFAULT_FOCUS_SETTINGS.ambientSound,
      dimBrightness: DEFAULT_FOCUS_SETTINGS.dimBrightness,
      blockNotifications: DEFAULT_FOCUS_SETTINGS.blockNotifications,
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useFocusModeStore.getState();

      expect(state.isActive).toBe(false);
      expect(state.isRunning).toBe(false);
      expect(state.duration).toBe(25);
      expect(state.ambientSound).toBe('none');
      expect(state.dimBrightness).toBe(false);
      expect(state.blockNotifications).toBe(true);
    });

    it('should have timeLeft set to duration in seconds', () => {
      const state = useFocusModeStore.getState();
      expect(state.timeLeft).toBe(25 * 60);
    });
  });

  describe('activate/deactivate actions', () => {
    it('should activate focus mode', () => {
      const { activate } = useFocusModeStore.getState();
      activate();

      const state = useFocusModeStore.getState();
      expect(state.isActive).toBe(true);
      expect(state.isRunning).toBe(false);
      expect(state.timeLeft).toBe(25 * 60);
    });

    it('should reset timeLeft when activating', () => {
      useFocusModeStore.setState({ timeLeft: 100 });

      const { activate } = useFocusModeStore.getState();
      activate();

      expect(useFocusModeStore.getState().timeLeft).toBe(25 * 60);
    });

    it('should deactivate focus mode', () => {
      useFocusModeStore.setState({ isActive: true, isRunning: true });

      const { deactivate } = useFocusModeStore.getState();
      deactivate();

      const state = useFocusModeStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.isRunning).toBe(false);
    });
  });

  describe('start/pause actions', () => {
    it('should start the timer', () => {
      const { start } = useFocusModeStore.getState();
      start();

      expect(useFocusModeStore.getState().isRunning).toBe(true);
    });

    it('should pause the timer', () => {
      useFocusModeStore.setState({ isRunning: true });

      const { pause } = useFocusModeStore.getState();
      pause();

      expect(useFocusModeStore.getState().isRunning).toBe(false);
    });
  });

  describe('reset action', () => {
    it('should reset timer to duration and stop running', () => {
      useFocusModeStore.setState({ timeLeft: 100, isRunning: true });

      const { reset } = useFocusModeStore.getState();
      reset();

      const state = useFocusModeStore.getState();
      expect(state.timeLeft).toBe(25 * 60);
      expect(state.isRunning).toBe(false);
    });

    it('should use current duration setting', () => {
      useFocusModeStore.setState({ duration: 45, timeLeft: 100 });

      const { reset } = useFocusModeStore.getState();
      reset();

      expect(useFocusModeStore.getState().timeLeft).toBe(45 * 60);
    });
  });

  describe('tick action', () => {
    it('should decrement timeLeft by 1 when running', () => {
      useFocusModeStore.setState({ isRunning: true, timeLeft: 100 });

      const { tick } = useFocusModeStore.getState();
      tick();

      expect(useFocusModeStore.getState().timeLeft).toBe(99);
    });

    it('should not decrement when not running', () => {
      useFocusModeStore.setState({ isRunning: false, timeLeft: 100 });

      const { tick } = useFocusModeStore.getState();
      tick();

      expect(useFocusModeStore.getState().timeLeft).toBe(100);
    });

    it('should not decrement when timeLeft is zero', () => {
      useFocusModeStore.setState({ isRunning: true, timeLeft: 0 });

      const { tick } = useFocusModeStore.getState();
      tick();

      expect(useFocusModeStore.getState().timeLeft).toBe(0);
    });

    it('should deactivate when timer reaches zero', () => {
      useFocusModeStore.setState({ isRunning: true, timeLeft: 1, isActive: true });

      const { tick } = useFocusModeStore.getState();
      tick();

      const state = useFocusModeStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.isRunning).toBe(false);
    });
  });

  describe('setDuration action', () => {
    it('should update duration and timeLeft', () => {
      const { setDuration } = useFocusModeStore.getState();
      setDuration(45);

      const state = useFocusModeStore.getState();
      expect(state.duration).toBe(45);
      expect(state.timeLeft).toBe(45 * 60);
    });
  });

  describe('setAmbientSound action', () => {
    it('should update ambient sound setting', () => {
      const { setAmbientSound } = useFocusModeStore.getState();
      setAmbientSound('rain');

      expect(useFocusModeStore.getState().ambientSound).toBe('rain');
    });

    it('should accept all ambient sound options', () => {
      const sounds = ['none', 'rain', 'forest', 'ocean', 'cafe', 'white-noise'] as const;

      sounds.forEach((sound) => {
        useFocusModeStore.getState().setAmbientSound(sound);
        expect(useFocusModeStore.getState().ambientSound).toBe(sound);
      });
    });
  });

  describe('setDimBrightness action', () => {
    it('should toggle dim brightness', () => {
      const { setDimBrightness } = useFocusModeStore.getState();

      setDimBrightness(true);
      expect(useFocusModeStore.getState().dimBrightness).toBe(true);

      setDimBrightness(false);
      expect(useFocusModeStore.getState().dimBrightness).toBe(false);
    });
  });

  describe('setBlockNotifications action', () => {
    it('should toggle block notifications', () => {
      const { setBlockNotifications } = useFocusModeStore.getState();

      setBlockNotifications(false);
      expect(useFocusModeStore.getState().blockNotifications).toBe(false);

      setBlockNotifications(true);
      expect(useFocusModeStore.getState().blockNotifications).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete focus session workflow', () => {
      const store = useFocusModeStore.getState();

      // Set up session
      store.setDuration(1); // 1 minute for quick test
      store.setAmbientSound('rain');
      store.setDimBrightness(true);

      // Activate
      store.activate();
      let state = useFocusModeStore.getState();
      expect(state.isActive).toBe(true);
      expect(state.timeLeft).toBe(60);

      // Start
      useFocusModeStore.getState().start();
      expect(useFocusModeStore.getState().isRunning).toBe(true);

      // Simulate some ticks
      for (let i = 0; i < 30; i++) {
        useFocusModeStore.getState().tick();
      }
      expect(useFocusModeStore.getState().timeLeft).toBe(30);

      // Pause
      useFocusModeStore.getState().pause();
      expect(useFocusModeStore.getState().isRunning).toBe(false);

      // Resume
      useFocusModeStore.getState().start();
      expect(useFocusModeStore.getState().isRunning).toBe(true);
    });

    it('should preserve settings across activate/deactivate cycles', () => {
      const store = useFocusModeStore.getState();

      // Configure settings
      store.setDuration(45);
      store.setAmbientSound('ocean');
      store.setDimBrightness(true);
      store.setBlockNotifications(false);

      // Activate and deactivate
      store.activate();
      useFocusModeStore.getState().deactivate();

      // Settings should persist
      const state = useFocusModeStore.getState();
      expect(state.duration).toBe(45);
      expect(state.ambientSound).toBe('ocean');
      expect(state.dimBrightness).toBe(true);
      expect(state.blockNotifications).toBe(false);
    });
  });
});
