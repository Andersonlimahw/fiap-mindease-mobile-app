import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { styles } from './PomodoroScreen.styles';
import { useTheme } from '@app/presentation/theme/theme';
import { useI18n } from '@app/presentation/i18n/I18nProvider';
import {
  usePomodoroMode,
  usePomodoroTimeLeft,
  usePomodoroIsRunning,
  usePomodoroStats,
  usePomodoroSettings,
  usePomodoroActions,
  formatTime,
  formatTotalTime,
} from '@store/pomodoroStore';
import type { PomodoroMode } from '@app/domain/entities/PomodoroSession';

const MODE_COLORS: Record<PomodoroMode, string> = {
  focus: '#DC2626',
  'short-break': '#16A34A',
  'long-break': '#2563EB',
};

export function PomodoroScreen() {
  const theme = useTheme();
  const { t } = useI18n();

  const mode = usePomodoroMode();
  const timeLeft = usePomodoroTimeLeft();
  const isRunning = usePomodoroIsRunning();
  const stats = usePomodoroStats();
  const settings = usePomodoroSettings();
  const { start, pause, reset, skip, tick, setMode, updateSettings } =
    usePomodoroActions();

  const [settingsVisible, setSettingsVisible] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer tick effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, tick]);

  const handlePlayPause = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, start, pause]);

  const handleModeChange = useCallback(
    (newMode: PomodoroMode) => {
      if (mode !== newMode) {
        setMode(newMode);
      }
    },
    [mode, setMode]
  );

  const handleSettingChange = useCallback(
    (
      key:
        | 'focusDuration'
        | 'shortBreakDuration'
        | 'longBreakDuration'
        | 'sessionsUntilLongBreak',
      delta: number
    ) => {
      const current = settings[key];
      const min = key === 'sessionsUntilLongBreak' ? 1 : 1;
      const max = key === 'sessionsUntilLongBreak' ? 10 : 60;
      const newValue = Math.max(min, Math.min(max, current + delta));
      updateSettings({ [key]: newValue });
    },
    [settings, updateSettings]
  );

  const modeColor = MODE_COLORS[mode];

  const renderModeButton = (m: PomodoroMode, label: string) => {
    const isActive = mode === m;
    return (
      <TouchableOpacity
        style={[
          styles.modeButton,
          isActive && [styles.modeButtonActive, { backgroundColor: modeColor }],
        ]}
        onPress={() => handleModeChange(m)}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={[
            styles.modeText,
            { color: isActive ? '#fff' : theme.colors.muted },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSettingRow = (
    label: string,
    key:
      | 'focusDuration'
      | 'shortBreakDuration'
      | 'longBreakDuration'
      | 'sessionsUntilLongBreak',
    suffix: string = 'min'
  ) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}>
      <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
        {label}
      </Text>
      <View style={styles.settingValue}>
        <TouchableOpacity
          style={[styles.settingButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => handleSettingChange(key, -1)}
        >
          <MaterialIcons name="remove" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.settingNumber, { color: theme.colors.text }]}>
          {settings[key]} {suffix}
        </Text>
        <TouchableOpacity
          style={[styles.settingButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => handleSettingChange(key, 1)}
        >
          <MaterialIcons name="add" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <View style={styles.content}>
        {/* Mode Selector */}
        <View style={[styles.modeSelector, { backgroundColor: theme.colors.surface }]}>
          {renderModeButton('focus', t('pomodoro.focus'))}
          {renderModeButton('short-break', t('pomodoro.shortBreak'))}
          {renderModeButton('long-break', t('pomodoro.longBreak'))}
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <View
            style={[
              styles.timerCircle,
              {
                borderColor: modeColor,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Text style={[styles.timerText, { color: theme.colors.text }]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={[styles.timerLabel, { color: modeColor }]}>
              {mode === 'focus'
                ? t('pomodoro.focus')
                : mode === 'short-break'
                ? t('pomodoro.shortBreak')
                : t('pomodoro.longBreak')}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
            onPress={reset}
            accessibilityLabel={t('pomodoro.reset')}
          >
            <MaterialIcons name="refresh" size={28} color={theme.colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.playButton, { backgroundColor: modeColor }]}
            onPress={handlePlayPause}
            accessibilityLabel={isRunning ? t('pomodoro.pause') : t('pomodoro.start')}
          >
            <MaterialIcons
              name={isRunning ? 'pause' : 'play-arrow'}
              size={40}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
            onPress={skip}
            accessibilityLabel={t('pomodoro.skip')}
          >
            <MaterialIcons name="skip-next" size={28} color={theme.colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={[styles.statsContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats.completedSessions}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.muted }]}>
              {t('pomodoro.sessions')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {formatTotalTime(stats.totalFocusTime)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.muted }]}>
              {t('pomodoro.totalFocusTime')}
            </Text>
          </View>
        </View>

        {/* Settings Button */}
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.colors.surface }]}
          onPress={() => setSettingsVisible(true)}
        >
          <MaterialIcons name="settings" size={20} color={theme.colors.muted} />
          <Text style={[styles.settingsText, { color: theme.colors.muted }]}>
            {t('pomodoro.settings')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSettingsVisible(false)}
          />
          <View
            style={[styles.modalContent, { backgroundColor: theme.colors.background }]}
          >
            <View style={[styles.modalHandle, { backgroundColor: theme.colors.border }]} />
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t('pomodoro.settings')}
              </Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {renderSettingRow(t('pomodoro.focusDuration'), 'focusDuration')}
              {renderSettingRow(t('pomodoro.shortBreakDuration'), 'shortBreakDuration')}
              {renderSettingRow(t('pomodoro.longBreakDuration'), 'longBreakDuration')}
              {renderSettingRow(
                t('pomodoro.sessionsUntilLongBreak'),
                'sessionsUntilLongBreak',
                ''
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
