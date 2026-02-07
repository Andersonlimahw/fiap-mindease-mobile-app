/**
 * Unit Tests for accessibilityStore
 * Tests Accessibility settings state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAccessibilityStore } from '../accessibilityStore';
import { DEFAULT_ACCESSIBILITY_SETTINGS } from '@app/domain/entities/AccessibilitySettings';

describe('accessibilityStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAccessibilityStore.setState({
      settings: { ...DEFAULT_ACCESSIBILITY_SETTINGS },
    });
  });

  describe('initial state', () => {
    it('should have default accessibility settings', () => {
      const { settings } = useAccessibilityStore.getState();

      expect(settings.fontSize).toBe(16);
      expect(settings.lineHeight).toBe(1.5);
      expect(settings.letterSpacing).toBe(0);
      expect(settings.reduceMotion).toBe(false);
      expect(settings.highContrast).toBe(false);
      expect(settings.colorBlindMode).toBe('none');
      expect(settings.hapticFeedback).toBe(true);
    });
  });

  describe('setFontSize action', () => {
    it('should update font size', () => {
      const { setFontSize } = useAccessibilityStore.getState();
      setFontSize(20);

      expect(useAccessibilityStore.getState().settings.fontSize).toBe(20);
    });

    it('should accept font size within valid range', () => {
      const { setFontSize } = useAccessibilityStore.getState();

      setFontSize(12); // min (FONT_SIZE_MIN)
      expect(useAccessibilityStore.getState().settings.fontSize).toBe(12);

      setFontSize(24); // max (FONT_SIZE_MAX)
      expect(useAccessibilityStore.getState().settings.fontSize).toBe(24);
    });
  });

  describe('setLineHeight action', () => {
    it('should update line height', () => {
      const { setLineHeight } = useAccessibilityStore.getState();
      setLineHeight(2.0);

      expect(useAccessibilityStore.getState().settings.lineHeight).toBe(2.0);
    });

    it('should accept line height within valid range', () => {
      const { setLineHeight } = useAccessibilityStore.getState();

      setLineHeight(1.2); // min (LINE_HEIGHT_MIN)
      expect(useAccessibilityStore.getState().settings.lineHeight).toBe(1.2);

      setLineHeight(2.0); // max (LINE_HEIGHT_MAX)
      expect(useAccessibilityStore.getState().settings.lineHeight).toBe(2.0);
    });
  });

  describe('setLetterSpacing action', () => {
    it('should update letter spacing', () => {
      const { setLetterSpacing } = useAccessibilityStore.getState();
      setLetterSpacing(2);

      expect(useAccessibilityStore.getState().settings.letterSpacing).toBe(2);
    });
  });

  describe('setReduceMotion action', () => {
    it('should enable reduce motion', () => {
      const { setReduceMotion } = useAccessibilityStore.getState();
      setReduceMotion(true);

      expect(useAccessibilityStore.getState().settings.reduceMotion).toBe(true);
    });

    it('should disable reduce motion', () => {
      useAccessibilityStore.setState({
        settings: { ...DEFAULT_ACCESSIBILITY_SETTINGS, reduceMotion: true },
      });

      const { setReduceMotion } = useAccessibilityStore.getState();
      setReduceMotion(false);

      expect(useAccessibilityStore.getState().settings.reduceMotion).toBe(false);
    });
  });

  describe('setHighContrast action', () => {
    it('should enable high contrast', () => {
      const { setHighContrast } = useAccessibilityStore.getState();
      setHighContrast(true);

      expect(useAccessibilityStore.getState().settings.highContrast).toBe(true);
    });

    it('should disable high contrast', () => {
      useAccessibilityStore.setState({
        settings: { ...DEFAULT_ACCESSIBILITY_SETTINGS, highContrast: true },
      });

      const { setHighContrast } = useAccessibilityStore.getState();
      setHighContrast(false);

      expect(useAccessibilityStore.getState().settings.highContrast).toBe(false);
    });
  });

  describe('setColorBlindMode action', () => {
    it('should set protanopia mode', () => {
      const { setColorBlindMode } = useAccessibilityStore.getState();
      setColorBlindMode('protanopia');

      expect(useAccessibilityStore.getState().settings.colorBlindMode).toBe(
        'protanopia'
      );
    });

    it('should set deuteranopia mode', () => {
      const { setColorBlindMode } = useAccessibilityStore.getState();
      setColorBlindMode('deuteranopia');

      expect(useAccessibilityStore.getState().settings.colorBlindMode).toBe(
        'deuteranopia'
      );
    });

    it('should set tritanopia mode', () => {
      const { setColorBlindMode } = useAccessibilityStore.getState();
      setColorBlindMode('tritanopia');

      expect(useAccessibilityStore.getState().settings.colorBlindMode).toBe(
        'tritanopia'
      );
    });

    it('should reset to none', () => {
      useAccessibilityStore.setState({
        settings: { ...DEFAULT_ACCESSIBILITY_SETTINGS, colorBlindMode: 'protanopia' },
      });

      const { setColorBlindMode } = useAccessibilityStore.getState();
      setColorBlindMode('none');

      expect(useAccessibilityStore.getState().settings.colorBlindMode).toBe('none');
    });
  });

  describe('setHapticFeedback action', () => {
    it('should disable haptic feedback', () => {
      const { setHapticFeedback } = useAccessibilityStore.getState();
      setHapticFeedback(false);

      expect(useAccessibilityStore.getState().settings.hapticFeedback).toBe(false);
    });

    it('should enable haptic feedback', () => {
      useAccessibilityStore.setState({
        settings: { ...DEFAULT_ACCESSIBILITY_SETTINGS, hapticFeedback: false },
      });

      const { setHapticFeedback } = useAccessibilityStore.getState();
      setHapticFeedback(true);

      expect(useAccessibilityStore.getState().settings.hapticFeedback).toBe(true);
    });
  });

  describe('updateSettings action', () => {
    it('should update multiple settings at once', () => {
      const { updateSettings } = useAccessibilityStore.getState();
      updateSettings({
        fontSize: 20,
        lineHeight: 2.0,
        reduceMotion: true,
      });

      const { settings } = useAccessibilityStore.getState();
      expect(settings.fontSize).toBe(20);
      expect(settings.lineHeight).toBe(2.0);
      expect(settings.reduceMotion).toBe(true);
    });

    it('should preserve other settings when updating', () => {
      useAccessibilityStore.setState({
        settings: {
          ...DEFAULT_ACCESSIBILITY_SETTINGS,
          highContrast: true,
          hapticFeedback: false,
        },
      });

      const { updateSettings } = useAccessibilityStore.getState();
      updateSettings({ fontSize: 24 });

      const { settings } = useAccessibilityStore.getState();
      expect(settings.fontSize).toBe(24);
      expect(settings.highContrast).toBe(true); // preserved
      expect(settings.hapticFeedback).toBe(false); // preserved
    });
  });

  describe('resetSettings action', () => {
    it('should reset all settings to defaults', () => {
      // Modify all settings
      useAccessibilityStore.setState({
        settings: {
          fontSize: 24,
          lineHeight: 2.5,
          letterSpacing: 3,
          reduceMotion: true,
          highContrast: true,
          colorBlindMode: 'protanopia',
          hapticFeedback: false,
        },
      });

      const { resetSettings } = useAccessibilityStore.getState();
      resetSettings();

      const { settings } = useAccessibilityStore.getState();
      expect(settings).toEqual(DEFAULT_ACCESSIBILITY_SETTINGS);
    });
  });

  describe('integration scenarios', () => {
    it('should handle typical user configuration workflow', () => {
      const store = useAccessibilityStore.getState();

      // User with vision impairment configures settings
      store.setFontSize(22);
      store.setLineHeight(2.0);
      store.setHighContrast(true);
      store.setColorBlindMode('deuteranopia');

      const { settings } = useAccessibilityStore.getState();
      expect(settings.fontSize).toBe(22);
      expect(settings.lineHeight).toBe(2.0);
      expect(settings.highContrast).toBe(true);
      expect(settings.colorBlindMode).toBe('deuteranopia');
    });

    it('should handle motion sensitivity configuration', () => {
      const store = useAccessibilityStore.getState();

      // User with vestibular disorder
      store.setReduceMotion(true);
      store.setHapticFeedback(false);

      const { settings } = useAccessibilityStore.getState();
      expect(settings.reduceMotion).toBe(true);
      expect(settings.hapticFeedback).toBe(false);
    });

    it('should support complete reset after customization', () => {
      const store = useAccessibilityStore.getState();

      // Customize everything
      store.setFontSize(28);
      store.setLineHeight(2.5);
      store.setLetterSpacing(2);
      store.setReduceMotion(true);
      store.setHighContrast(true);
      store.setColorBlindMode('tritanopia');
      store.setHapticFeedback(false);

      // Verify customization
      let { settings } = useAccessibilityStore.getState();
      expect(settings.fontSize).toBe(28);
      expect(settings.colorBlindMode).toBe('tritanopia');

      // Reset
      useAccessibilityStore.getState().resetSettings();

      // Verify reset
      settings = useAccessibilityStore.getState().settings;
      expect(settings).toEqual(DEFAULT_ACCESSIBILITY_SETTINGS);
    });
  });
});
