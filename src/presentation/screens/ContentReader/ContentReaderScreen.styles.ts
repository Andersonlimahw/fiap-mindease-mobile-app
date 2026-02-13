import { Platform, StyleSheet } from 'react-native';
import type { AppTheme } from '@presentation/theme/theme';

export const makeContentReaderStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xl * 2,
    },

    // Content selector
    selectorContainer: {
      marginBottom: theme.spacing.lg,
    },
    selectorTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.muted,
      marginBottom: theme.spacing.sm,
      fontFamily: theme.fonts.medium,
    },
    contentCard: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      marginBottom: theme.spacing.sm,
      ...(Platform.OS === 'ios'
        ? {
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          }
        : { elevation: 1 }),
    },
    contentCardActive: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    contentCardPressed: {
      opacity: 0.8,
    },
    contentCardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
      fontFamily: theme.fonts.medium,
    },
    contentCardMeta: {
      fontSize: 12,
      color: theme.colors.muted,
      fontFamily: theme.fonts.regular,
    },

    // Mode toggle
    modeToggleContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: 4,
      marginBottom: theme.spacing.lg,
    },
    modeButton: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      alignItems: 'center',
      borderRadius: theme.radius.sm,
    },
    modeButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    modeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.muted,
      fontFamily: theme.fonts.medium,
    },
    modeButtonTextActive: {
      color: '#FFFFFF',
    },

    // Content display
    contentContainer: {
      backgroundColor: theme.colors.card,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.md,
      marginBottom: theme.spacing.lg,
      ...(Platform.OS === 'ios'
        ? {
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
          }
        : { elevation: 2 }),
    },
    contentTitle: {
      fontSize: theme.text.h2,
      fontWeight: '700',
      color: theme.colors.cardText,
      marginBottom: theme.spacing.sm,
      fontFamily: theme.fonts.bold,
    },
    contentMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    readTimeText: {
      fontSize: 12,
      color: theme.colors.cardText,
      opacity: 0.7,
      marginLeft: 4,
      fontFamily: theme.fonts.regular,
    },
    categoryBadge: {
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      borderRadius: theme.radius.sm,
      marginLeft: theme.spacing.md,
    },
    categoryText: {
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '600',
      fontFamily: theme.fonts.medium,
    },
    contentText: {
      fontSize: 16,
      lineHeight: 26,
      color: theme.colors.cardText,
      fontFamily: theme.fonts.regular,
    },

    // Audio controls
    audioControlsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      marginBottom: theme.spacing.md,
    },
    audioButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.md,
    },
    audioButtonStop: {
      backgroundColor: theme.colors.danger,
    },
    audioButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: theme.spacing.xs,
      fontFamily: theme.fonts.medium,
    },
    speakingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: theme.spacing.md,
    },
    speakingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.success,
      marginRight: 6,
    },
    speakingText: {
      fontSize: 12,
      color: theme.colors.success,
      fontFamily: theme.fonts.regular,
    },

    // View mode toggle
    viewModeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.sm,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.surface,
    },
    viewModeText: {
      fontSize: 13,
      color: theme.colors.primary,
      marginLeft: 4,
      fontFamily: theme.fonts.medium,
    },

    // Empty state
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl * 2,
    },
    emptyIcon: {
      marginBottom: theme.spacing.md,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
      fontFamily: theme.fonts.medium,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.muted,
      textAlign: 'center',
      fontFamily: theme.fonts.regular,
    },
  });
