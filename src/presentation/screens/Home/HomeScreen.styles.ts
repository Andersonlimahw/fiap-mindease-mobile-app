import { Platform, StyleSheet } from "react-native";
import type { AppTheme } from "@presentation/theme/theme";

export const makeHomeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.lg,
    },
    hello: { color: theme.colors.muted, fontFamily: theme.fonts.regular },
    username: {
      fontSize: theme.text.h2,
      fontWeight: "700",
      color: theme.colors.text,
      fontFamily: theme.fonts.bold,
    },

    // Summary card
    summaryCard: {
      backgroundColor: theme.colors.card,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.md,
      marginBottom: theme.spacing.lg,
      ...(Platform.OS === "ios"
        ? {
            shadowColor: "#000",
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
          }
        : { elevation: 2 }),
    },
    summaryTitle: {
      color: theme.colors.cardText,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: theme.spacing.md,
      fontFamily: theme.fonts.bold,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
    },
    statItem: {
      alignItems: "center",
      flex: 1,
    },
    statValue: {
      color: theme.colors.cardText,
      fontSize: 20,
      fontWeight: "800",
      marginTop: 4,
      fontFamily: theme.fonts.bold,
    },
    statLabel: {
      color: theme.colors.cardText,
      opacity: 0.7,
      fontSize: 11,
      marginTop: 2,
      fontFamily: theme.fonts.regular,
    },
    statDivider: {
      width: 1,
      height: 36,
      backgroundColor: theme.colors.cardText,
      opacity: 0.15,
    },

    // Section title
    sectionTitle: {
      fontWeight: "700",
      fontSize: 16,
      marginBottom: theme.spacing.sm,
      color: theme.colors.text,
      fontFamily: theme.fonts.bold,
    },

    // Quick actions
    actionsRow: {
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.md,
    },
    quickAction: {
      width: 80,
      alignItems: "center",
    },
    quickActionPressed: {
      opacity: 0.7,
    },
    quickActionIcon: {
      width: 52,
      height: 52,
      borderRadius: theme.radius.md,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    quickActionLabel: {
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
      color: theme.colors.text,
      fontFamily: theme.fonts.medium,
    },

    // Task list
    taskItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.radius.sm,
      marginBottom: theme.spacing.xs,
    },
    priorityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: theme.spacing.sm,
    },
    taskTitle: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.text,
      fontFamily: theme.fonts.regular,
    },

    // Empty state
    emptyState: {
      alignItems: "center",
      paddingVertical: theme.spacing.xl,
    },
    emptyText: {
      color: theme.colors.muted,
      marginTop: theme.spacing.sm,
      fontSize: 14,
      fontFamily: theme.fonts.regular,
    },

    // Sign out
    signOut: {
      color: theme.colors.accent,
      marginTop: theme.spacing.lg,
      textAlign: "center",
      fontFamily: theme.fonts.medium,
    },
  });
