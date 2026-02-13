import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@presentation/theme/theme';
import { useI18n } from '@presentation/i18n/I18nProvider';
import { makeContentReaderStyles } from './ContentReaderScreen.styles';
import {
  useCurrentContent,
  useViewMode,
  useIsSpeaking,
  useSampleContents,
  useContentReaderActions,
} from '@store/contentReaderStore';
import type { ContentItem } from '@app/domain/entities/ContentItem';

export function ContentReaderScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeContentReaderStyles(theme), [theme]);

  const currentContent = useCurrentContent();
  const viewMode = useViewMode();
  const isSpeaking = useIsSpeaking();
  const sampleContents = useSampleContents();
  const { setContent, setViewMode, startSpeaking, stopSpeaking } =
    useContentReaderActions();

  const handleSelectContent = useCallback(
    (content: ContentItem) => {
      setContent(content);
    },
    [setContent]
  );

  const handleToggleAudio = useCallback(async () => {
    if (isSpeaking) {
      await stopSpeaking();
    } else if (currentContent) {
      const textToRead =
        viewMode === 'summary'
          ? currentContent.summary
          : currentContent.fullContent;
      await startSpeaking(textToRead);
    }
  }, [isSpeaking, currentContent, viewMode, startSpeaking, stopSpeaking]);

  const displayedText = useMemo(() => {
    if (!currentContent) return '';
    return viewMode === 'summary'
      ? currentContent.summary
      : currentContent.fullContent;
  }, [currentContent, viewMode]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Content Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorTitle}>{t('contentReader.selectContent')}</Text>
        {sampleContents.map((content) => (
          <Pressable
            key={content.id}
            style={({ pressed }) => [
              styles.contentCard,
              currentContent?.id === content.id && styles.contentCardActive,
              pressed && styles.contentCardPressed,
            ]}
            onPress={() => handleSelectContent(content)}
            accessibilityRole="button"
            accessibilityLabel={content.title}
          >
            <Text style={styles.contentCardTitle}>{content.title}</Text>
            <Text style={styles.contentCardMeta}>
              {content.readTimeMinutes} {t('contentReader.readTime')}
              {content.category && ` • ${content.category}`}
            </Text>
          </Pressable>
        ))}
      </View>

      {currentContent ? (
        <>
          {/* Mode Toggle */}
          <View style={styles.modeToggleContainer}>
            <Pressable
              style={[
                styles.modeButton,
                viewMode === 'summary' && styles.modeButtonActive,
              ]}
              onPress={() => setViewMode('summary')}
              accessibilityRole="button"
              accessibilityLabel={t('contentReader.summary')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  viewMode === 'summary' && styles.modeButtonTextActive,
                ]}
              >
                {t('contentReader.summary')}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeButton,
                viewMode === 'detailed' && styles.modeButtonActive,
              ]}
              onPress={() => setViewMode('detailed')}
              accessibilityRole="button"
              accessibilityLabel={t('contentReader.detailed')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  viewMode === 'detailed' && styles.modeButtonTextActive,
                ]}
              >
                {t('contentReader.detailed')}
              </Text>
            </Pressable>
          </View>

          {/* Audio Controls */}
          <View style={styles.audioControlsContainer}>
            <Pressable
              style={[styles.audioButton, isSpeaking && styles.audioButtonStop]}
              onPress={handleToggleAudio}
              accessibilityRole="button"
              accessibilityLabel={
                isSpeaking
                  ? t('contentReader.stopReading')
                  : t('contentReader.readAloud')
              }
            >
              <MaterialIcons
                name={isSpeaking ? 'stop' : 'volume-up'}
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.audioButtonText}>
                {isSpeaking
                  ? t('contentReader.stopReading')
                  : t('contentReader.readAloud')}
              </Text>
            </Pressable>
            {isSpeaking && (
              <View style={styles.speakingIndicator}>
                <Animated.View style={styles.speakingDot} />
                <Text style={styles.speakingText}>
                  {t('contentReader.audioOn')}
                </Text>
              </View>
            )}
          </View>

          {/* Content Display */}
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>{currentContent.title}</Text>
            <View style={styles.contentMeta}>
              <MaterialIcons
                name="schedule"
                size={14}
                color={theme.colors.cardText}
                style={{ opacity: 0.7 }}
              />
              <Text style={styles.readTimeText}>
                {currentContent.readTimeMinutes} {t('contentReader.readTime')}
              </Text>
              {currentContent.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {currentContent.category}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.contentText}>{displayedText}</Text>
          </View>

          {/* View Mode Toggle Hint */}
          <Pressable
            style={styles.viewModeButton}
            onPress={() =>
              setViewMode(viewMode === 'summary' ? 'detailed' : 'summary')
            }
            accessibilityRole="button"
          >
            <MaterialIcons
              name={viewMode === 'summary' ? 'expand-more' : 'expand-less'}
              size={18}
              color={theme.colors.primary}
            />
            <Text style={styles.viewModeText}>
              {viewMode === 'summary'
                ? t('contentReader.readFullVersion')
                : t('contentReader.viewSummary')}
            </Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons
            name="menu-book"
            size={48}
            color={theme.colors.muted}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTitle}>{t('contentReader.noContent')}</Text>
          <Text style={styles.emptyText}>{t('contentReader.selectToRead')}</Text>
        </View>
      )}
    </ScrollView>
  );
}

export default ContentReaderScreen;
