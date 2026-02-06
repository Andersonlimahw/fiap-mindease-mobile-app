import React, { useCallback } from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';

import { styles } from './AccessibilityScreen.styles';
import { useTheme } from '@app/presentation/theme/theme';
import { useI18n } from '@app/presentation/i18n/I18nProvider';
import {
  useAccessibilitySettings,
  useAccessibilityActions,
} from '@store/accessibilityStore';
import {
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
  LINE_HEIGHT_MIN,
  LINE_HEIGHT_MAX,
  COLOR_BLIND_MODES,
} from '@app/domain/entities/AccessibilitySettings';
import type { ColorBlindMode } from '@app/domain/entities/AccessibilitySettings';

const ACCENT_COLOR = '#6366F1'; // Indigo for accessibility

export function AccessibilityScreen() {
  const theme = useTheme();
  const { t } = useI18n();

  const settings = useAccessibilitySettings();
  const {
    setFontSize,
    setLineHeight,
    setReduceMotion,
    setHighContrast,
    setColorBlindMode,
    setHapticFeedback,
    resetSettings,
  } = useAccessibilityActions();

  const handleFontSizeChange = useCallback(
    (value: number) => {
      setFontSize(Math.round(value));
    },
    [setFontSize]
  );

  const handleLineHeightChange = useCallback(
    (value: number) => {
      setLineHeight(Math.round(value * 10) / 10);
    },
    [setLineHeight]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Typography Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.muted }]}>
            Typography
          </Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            {/* Font Size */}
            <View
              style={[
                styles.sliderContainer,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <View style={styles.sliderLabel}>
                <Text style={[styles.sliderLabelText, { color: theme.colors.text }]}>
                  {t('accessibility.fontSize')}
                </Text>
                <Text style={[styles.sliderValueText, { color: ACCENT_COLOR }]}>
                  {settings.fontSize}px
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={FONT_SIZE_MIN}
                maximumValue={FONT_SIZE_MAX}
                value={settings.fontSize}
                onValueChange={handleFontSizeChange}
                step={1}
                minimumTrackTintColor={ACCENT_COLOR}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={ACCENT_COLOR}
              />
            </View>

            {/* Line Height */}
            <View style={[styles.sliderContainer, { borderBottomWidth: 0 }]}>
              <View style={styles.sliderLabel}>
                <Text style={[styles.sliderLabelText, { color: theme.colors.text }]}>
                  {t('accessibility.lineHeight')}
                </Text>
                <Text style={[styles.sliderValueText, { color: ACCENT_COLOR }]}>
                  {settings.lineHeight.toFixed(1)}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={LINE_HEIGHT_MIN}
                maximumValue={LINE_HEIGHT_MAX}
                value={settings.lineHeight}
                onValueChange={handleLineHeightChange}
                step={0.1}
                minimumTrackTintColor={ACCENT_COLOR}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={ACCENT_COLOR}
              />
            </View>
          </View>
        </View>

        {/* Visual Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.muted }]}>
            Visual
          </Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            {/* Reduce Motion */}
            <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                {t('accessibility.reduceMotion')}
              </Text>
              <Switch
                value={settings.reduceMotion}
                onValueChange={setReduceMotion}
                trackColor={{ false: theme.colors.border, true: ACCENT_COLOR }}
              />
            </View>

            {/* High Contrast */}
            <View style={[styles.row, styles.rowLast]}>
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                {t('accessibility.highContrast')}
              </Text>
              <Switch
                value={settings.highContrast}
                onValueChange={setHighContrast}
                trackColor={{ false: theme.colors.border, true: ACCENT_COLOR }}
              />
            </View>
          </View>
        </View>

        {/* Color Blind Mode Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.muted }]}>
            {t('accessibility.colorBlindMode')}
          </Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.colorBlindOptions}>
              <View style={styles.colorBlindGrid}>
                {COLOR_BLIND_MODES.map((mode) => {
                  const isSelected = settings.colorBlindMode === mode.id;
                  return (
                    <TouchableOpacity
                      key={mode.id}
                      style={[
                        styles.colorBlindButton,
                        { borderColor: theme.colors.border },
                        isSelected && [
                          styles.colorBlindButtonActive,
                          { backgroundColor: ACCENT_COLOR },
                        ],
                      ]}
                      onPress={() => setColorBlindMode(mode.id)}
                    >
                      <Text
                        style={[
                          styles.colorBlindText,
                          { color: isSelected ? '#fff' : theme.colors.text },
                        ]}
                      >
                        {t(`accessibility.colorBlindModes.${mode.id}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Interaction Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.muted }]}>
            Interaction
          </Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            {/* Haptic Feedback */}
            <View style={[styles.row, styles.rowLast]}>
              <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
                {t('accessibility.hapticFeedback')}
              </Text>
              <Switch
                value={settings.hapticFeedback}
                onValueChange={setHapticFeedback}
                trackColor={{ false: theme.colors.border, true: ACCENT_COLOR }}
              />
            </View>
          </View>
        </View>

        {/* Preview Section */}
        <View style={styles.previewSection}>
          <Text style={[styles.previewTitle, { color: theme.colors.muted }]}>
            Preview
          </Text>
          <View
            style={[styles.previewCard, { backgroundColor: theme.colors.surface }]}
          >
            <Text
              style={[
                styles.previewText,
                {
                  color: theme.colors.text,
                  fontSize: settings.fontSize,
                  lineHeight: settings.fontSize * settings.lineHeight,
                  letterSpacing: settings.letterSpacing,
                },
              ]}
            >
              The quick brown fox jumps over the lazy dog. Este texto demonstra
              as configurações de acessibilidade aplicadas.
            </Text>
          </View>
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: theme.colors.surface }]}
          onPress={resetSettings}
        >
          <Text style={[styles.resetText, { color: theme.colors.danger }]}>
            {t('accessibility.resetToDefaults')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
