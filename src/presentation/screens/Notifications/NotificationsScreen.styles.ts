import { StyleSheet } from 'react-native';
import type { AppTheme } from '../presentation/theme/theme';

export const makeNotificationsStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    list: {
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    emptyContainer: {
      flex: 1,
    },
    markAllBtn: {
      alignSelf: 'flex-end',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    markAllText: {
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
    },
    itemUnread: {
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    titleUnread: {
      fontWeight: '700',
    },
    body: {
      fontSize: 12,
      color: theme.colors.muted,
      lineHeight: 16,
    },
    time: {
      fontSize: 11,
      color: theme.colors.muted,
      marginTop: 2,
    },
    deleteBtn: {
      padding: 4,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingTop: 80,
    },
    emptyText: {
      fontSize: 15,
      color: theme.colors.muted,
    },
  });
