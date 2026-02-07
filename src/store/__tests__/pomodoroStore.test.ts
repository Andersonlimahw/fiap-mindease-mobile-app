/**
 * Unit Tests for pomodoroStore
 * Tests Pomodoro timer state management, actions, and helpers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePomodoroStore, formatTime, formatTotalTime } from '../pomodoroStore';
import { DEFAULT_POMODORO_SETTINGS } from '@app/domain/entities/PomodoroSession';

describe('pomodoroStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    usePomodoroStore.setState({
      mode: 'focus',
      timeLeft: DEFAULT_POMODORO_SETTINGS.focusDuration * 60,
      isRunning: false,
      completedSessions: 0,
      totalFocusTime: 0,
      focusDuration: DEFAULT_POMODORO_SETTINGS.focusDuration,
      shortBreakDuration: DEFAULT_POMODORO_SETTINGS.shortBreakDuration,
      longBreakDuration: DEFAULT_POMODORO_SETTINGS.longBreakDuration,
      sessionsUntilLongBreak: DEFAULT_POMODORO_SETTINGS.sessionsUntilLongBreak,
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = usePomodoroStore.getState();

      expect(state.mode).toBe('focus');
      expect(state.isRunning).toBe(false);
      expect(state.completedSessions).toBe(0);
      expect(state.totalFocusTime).toBe(0);
      expect(state.focusDuration).toBe(25);
      expect(state.shortBreakDuration).toBe(5);
      expect(state.longBreakDuration).toBe(15);
      expect(state.sessionsUntilLongBreak).toBe(4);
    });

    it('should have timeLeft set to focus duration in seconds', () => {
      const state = usePomodoroStore.getState();
      expect(state.timeLeft).toBe(25 * 60); // 25 minutes in seconds
    });
  });

  describe('start/pause actions', () => {
    it('should start the timer', () => {
      const { start } = usePomodoroStore.getState();
      start();

      expect(usePomodoroStore.getState().isRunning).toBe(true);
    });

    it('should pause the timer', () => {
      usePomodoroStore.setState({ isRunning: true });

      const { pause } = usePomodoroStore.getState();
      pause();

      expect(usePomodoroStore.getState().isRunning).toBe(false);
    });
  });

  describe('reset action', () => {
    it('should reset timer to focus duration when in focus mode', () => {
      usePomodoroStore.setState({ timeLeft: 100, isRunning: true });

      const { reset } = usePomodoroStore.getState();
      reset();

      const state = usePomodoroStore.getState();
      expect(state.timeLeft).toBe(25 * 60);
      expect(state.isRunning).toBe(false);
    });

    it('should reset timer to short-break duration when in short-break mode', () => {
      usePomodoroStore.setState({ mode: 'short-break', timeLeft: 100 });

      const { reset } = usePomodoroStore.getState();
      reset();

      expect(usePomodoroStore.getState().timeLeft).toBe(5 * 60);
    });

    it('should reset timer to long-break duration when in long-break mode', () => {
      usePomodoroStore.setState({ mode: 'long-break', timeLeft: 100 });

      const { reset } = usePomodoroStore.getState();
      reset();

      expect(usePomodoroStore.getState().timeLeft).toBe(15 * 60);
    });
  });

  describe('skip action', () => {
    it('should skip from focus to short-break and increment sessions', () => {
      const { skip } = usePomodoroStore.getState();
      skip();

      const state = usePomodoroStore.getState();
      expect(state.mode).toBe('short-break');
      expect(state.completedSessions).toBe(1);
      expect(state.timeLeft).toBe(5 * 60);
      expect(state.isRunning).toBe(false);
    });

    it('should skip from focus to long-break after 4 sessions', () => {
      usePomodoroStore.setState({ completedSessions: 3 });

      const { skip } = usePomodoroStore.getState();
      skip();

      const state = usePomodoroStore.getState();
      expect(state.mode).toBe('long-break');
      expect(state.completedSessions).toBe(4);
      expect(state.timeLeft).toBe(15 * 60);
    });

    it('should skip from break to focus', () => {
      usePomodoroStore.setState({ mode: 'short-break' });

      const { skip } = usePomodoroStore.getState();
      skip();

      const state = usePomodoroStore.getState();
      expect(state.mode).toBe('focus');
      expect(state.timeLeft).toBe(25 * 60);
    });
  });

  describe('tick action', () => {
    it('should decrement timeLeft by 1 when running', () => {
      usePomodoroStore.setState({ isRunning: true, timeLeft: 100 });

      const { tick } = usePomodoroStore.getState();
      tick();

      expect(usePomodoroStore.getState().timeLeft).toBe(99);
    });

    it('should not decrement when not running', () => {
      usePomodoroStore.setState({ isRunning: false, timeLeft: 100 });

      const { tick } = usePomodoroStore.getState();
      tick();

      expect(usePomodoroStore.getState().timeLeft).toBe(100);
    });

    it('should track totalFocusTime in focus mode', () => {
      usePomodoroStore.setState({ isRunning: true, timeLeft: 100, mode: 'focus' });

      const { tick } = usePomodoroStore.getState();
      tick();

      expect(usePomodoroStore.getState().totalFocusTime).toBe(1);
    });

    it('should not track totalFocusTime in break mode', () => {
      usePomodoroStore.setState({
        isRunning: true,
        timeLeft: 100,
        mode: 'short-break',
        totalFocusTime: 10,
      });

      const { tick } = usePomodoroStore.getState();
      tick();

      expect(usePomodoroStore.getState().totalFocusTime).toBe(10);
    });

    it('should skip to next mode when timer reaches zero', () => {
      usePomodoroStore.setState({ isRunning: true, timeLeft: 1, mode: 'focus' });

      const { tick } = usePomodoroStore.getState();
      tick();

      const state = usePomodoroStore.getState();
      expect(state.mode).toBe('short-break');
      expect(state.completedSessions).toBe(1);
    });
  });

  describe('setMode action', () => {
    it('should change mode and reset timer', () => {
      const { setMode } = usePomodoroStore.getState();
      setMode('long-break');

      const state = usePomodoroStore.getState();
      expect(state.mode).toBe('long-break');
      expect(state.timeLeft).toBe(15 * 60);
      expect(state.isRunning).toBe(false);
    });
  });

  describe('updateSettings action', () => {
    it('should update settings', () => {
      const { updateSettings } = usePomodoroStore.getState();
      updateSettings({ focusDuration: 30, shortBreakDuration: 10 });

      const state = usePomodoroStore.getState();
      expect(state.focusDuration).toBe(30);
      expect(state.shortBreakDuration).toBe(10);
    });

    it('should reset timer when not running after settings update', () => {
      const { updateSettings } = usePomodoroStore.getState();
      updateSettings({ focusDuration: 30 });

      expect(usePomodoroStore.getState().timeLeft).toBe(30 * 60);
    });
  });

  describe('resetStats action', () => {
    it('should reset completed sessions and total focus time', () => {
      usePomodoroStore.setState({
        completedSessions: 10,
        totalFocusTime: 5000,
      });

      const { resetStats } = usePomodoroStore.getState();
      resetStats();

      const state = usePomodoroStore.getState();
      expect(state.completedSessions).toBe(0);
      expect(state.totalFocusTime).toBe(0);
    });
  });
});

describe('formatTime helper', () => {
  it('should format seconds to MM:SS', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(3600)).toBe('60:00');
    expect(formatTime(1500)).toBe('25:00'); // 25 minutes
  });

  it('should pad single digits with zeros', () => {
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(65)).toBe('01:05');
  });
});

describe('formatTotalTime helper', () => {
  it('should format seconds to Xh Xm or Xm', () => {
    expect(formatTotalTime(0)).toBe('0m');
    expect(formatTotalTime(60)).toBe('1m');
    expect(formatTotalTime(3600)).toBe('1h 0m');
    expect(formatTotalTime(3660)).toBe('1h 1m');
    expect(formatTotalTime(7200)).toBe('2h 0m');
    expect(formatTotalTime(5400)).toBe('1h 30m');
  });

  it('should return only minutes when less than 1 hour', () => {
    expect(formatTotalTime(1500)).toBe('25m'); // 25 minutes
    expect(formatTotalTime(2700)).toBe('45m'); // 45 minutes
  });
});
