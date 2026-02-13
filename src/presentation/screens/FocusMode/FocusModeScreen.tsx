import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { styles } from './FocusModeScreen.styles';
import { useTheme } from '@app/presentation/theme/theme';
import { useI18n } from '@app/presentation/i18n/I18nProvider';
import {
  useFocusIsActive,
  useFocusTimeLeft,
  useFocusIsRunning,
  useFocusSettings,
  useFocusActions,
} from '@store/focusModeStore';
import { formatTime } from '@store/pomodoroStore';
import type { AmbientSound } from '@app/domain/entities/FocusSession';

const DURATION_OPTIONS = [15, 25, 30, 45, 60];

const SOUND_OPTIONS: { id: AmbientSound; icon: string }[] = [
  { id: 'none', icon: 'volume-off' },
  { id: 'rain', icon: 'water-drop' },
  { id: 'forest', icon: 'park' },
  { id: 'ocean', icon: 'waves' },
  { id: 'cafe', icon: 'local-cafe' },
  { id: 'white-noise', icon: 'graphic-eq' },
];

const FOCUS_COLOR = '#8B5CF6'; // Purple for focus mode

export function FocusModeScreen() {
  const theme = useTheme();
  const { t } = useI18n();

  const isActive = useFocusIsActive();
  const timeLeft = useFocusTimeLeft();
  const isRunning = useFocusIsRunning();
  const settings = useFocusSettings();
  const {
    activate,
    deactivate,
    start,
    pause,
    reset,
    tick,
    setDuration,
    setAmbientSound,
    setDimBrightness,
    setBlockNotifications,
  } = useFocusActions();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer tick effect
  useEffect(() => {
    if (isRunning && isActive) {
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
  }, [isRunning, isActive, tick]);

  const handlePlayPause = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, start, pause]);

  const handleActivate = useCallback(() => {
    activate();
    start();
  }, [activate, start]);

  // Active Focus Mode UI
  if (isActive) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.activeContainer}>
          <View
            style={[
              styles.activeTimerCircle,
              {
                borderColor: FOCUS_COLOR,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Text style={[styles.activeTimerText, { color: theme.colors.text }]}>
              {formatTime(timeLeft)}
            </Text>
            <Text style={[styles.activeTimerLabel, { color: FOCUS_COLOR }]}>
              {t('focusMode.title')}
            </Text>
          </View>

          <View style={styles.activeControls}>
            <TouchableOpacity
              style={[
                styles.activeControlButton,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={reset}
            >
              <MaterialIcons name="refresh" size={28} color={theme.colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.activeControlButton,
                styles.activePlayButton,
                { backgroundColor: FOCUS_COLOR },
              ]}
              onPress={handlePlayPause}
            >
              <MaterialIcons
                name={isRunning ? 'pause' : 'play-arrow'}
                size={40}
                color="#fff"
              />
            </TouchableOpacity>

            <View style={[styles.activeControlButton, { opacity: 0 }]} />
          </View>

          <TouchableOpacity
            style={[styles.deactivateButton, { backgroundColor: theme.colors.danger }]}
            onPress={deactivate}
          >
            <Text style={styles.deactivateText}>{t('focusMode.deactivate')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Inactive - Setup UI
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: FOCUS_COLOR }]}>
            <MaterialIcons name="self-improvement" size={40} color="#fff" />
          </View>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {t('focusMode.title')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.muted }]}>
            Minimize distractions and stay focused on your work
          </Text>
        </View>

        {/* Duration Selection */}
        <View style={styles.durationSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('focusMode.duration')}
          </Text>
          <View style={styles.durationOptions}>
            {DURATION_OPTIONS.map((mins) => {
              const isSelected = settings.duration === mins;
              return (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.durationButton,
                    { borderColor: theme.colors.border },
                    isSelected && [
                      styles.durationButtonActive,
                      { backgroundColor: FOCUS_COLOR },
                    ],
                  ]}
                  onPress={() => setDuration(mins)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      { color: isSelected ? '#fff' : theme.colors.text },
                    ]}
                  >
                    {mins}
                  </Text>
                  <Text
                    style={[
                      styles.durationLabel,
                      { color: isSelected ? '#fff' : theme.colors.muted },
                    ]}
                  >
                    {t('focusMode.minutes')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Ambient Sound Selection */}
        <View style={styles.soundSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('focusMode.ambientSound')}
          </Text>
          <View style={styles.soundGrid}>
            {SOUND_OPTIONS.map((sound) => {
              const isSelected = settings.ambientSound === sound.id;
              return (
                <TouchableOpacity
                  key={sound.id}
                  style={[
                    styles.soundButton,
                    { borderColor: theme.colors.border },
                    isSelected && [
                      styles.soundButtonActive,
                      { backgroundColor: FOCUS_COLOR },
                    ],
                  ]}
                  onPress={() => setAmbientSound(sound.id)}
                >
                  <MaterialIcons
                    name={sound.icon as any}
                    size={28}
                    color={isSelected ? '#fff' : theme.colors.muted}
                  />
                  <Text
                    style={[
                      styles.soundText,
                      { color: isSelected ? '#fff' : theme.colors.muted },
                    ]}
                  >
                    {t(`focusMode.sounds.${sound.id === 'white-noise' ? 'whiteNoise' : sound.id}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('pomodoro.settings')}
          </Text>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              {t('focusMode.dimBrightness')}
            </Text>
            <Switch
              value={settings.dimBrightness}
              onValueChange={setDimBrightness}
              trackColor={{ false: theme.colors.border, true: FOCUS_COLOR }}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              {t('focusMode.blockNotifications')}
            </Text>
            <Switch
              value={settings.blockNotifications}
              onValueChange={setBlockNotifications}
              trackColor={{ false: theme.colors.border, true: FOCUS_COLOR }}
            />
          </View>
        </View>

        {/* Activate Button */}
        <TouchableOpacity
          style={[styles.activateButton, { backgroundColor: FOCUS_COLOR }]}
          onPress={handleActivate}
        >
          <Text style={styles.activateText}>{t('focusMode.activate')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
