import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Animated,
  Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@store/authStore";
import { usePendingTasks } from "@store/tasksStore";
import { usePomodoroStats } from "@store/pomodoroStore";
import { formatTotalTime } from "@store/pomodoroStore";
import { useTheme } from "@presentation/theme/theme";
import { makeHomeStyles } from "./HomeScreen.styles";
import { useFadeSlideInOnFocus } from "../../hooks/animations";
import { Avatar } from "@components/Avatar";
import { useI18n } from "@presentation/i18n/I18nProvider";

type QuickActionItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  color: string;
  route: string;
};

export const HomeScreen: React.FC<any> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const pendingTasks = usePendingTasks();
  const { completedSessions, totalFocusTime } = usePomodoroStats();
  const { animatedStyle } = useFadeSlideInOnFocus();
  const { t } = useI18n();
  const theme = useTheme();
  const styles = useMemo(() => makeHomeStyles(theme), [theme]);

  const quickActions: QuickActionItem[] = useMemo(
    () => [
      { key: "tasks", label: t("home.tasks"), icon: "check-circle", color: "#16A34A", route: "Tasks" },
      { key: "pomodoro", label: t("home.pomodoro"), icon: "timer", color: "#DC2626", route: "Pomodoro" },
      { key: "focus", label: t("home.focus"), icon: "self-improvement", color: "#8B5CF6", route: "FocusMode" },
      { key: "chat", label: t("home.chat"), icon: "chat", color: "#2563EB", route: "Chat" },
      { key: "accessibility", label: t("home.accessibility"), icon: "accessibility", color: "#6366F1", route: "Accessibility" },
    ],
    [t]
  );

  return (
    <Animated.ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={animatedStyle as any}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>{t("home.hello")}</Text>
            <Text style={styles.username}>
              {user?.name || t("home.userFallback")}
            </Text>
          </View>
          <Avatar
            username={user?.name}
            source={user?.photoUrl ? { uri: user.photoUrl } : undefined}
            size={40}
            onPress={() => (navigation as any)?.navigate?.("User")}
          />
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t("home.todaySummary")}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="check-circle" size={22} color="#16A34A" />
              <Text style={styles.statValue}>{pendingTasks.length}</Text>
              <Text style={styles.statLabel}>{t("home.pendingTasks")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="timer" size={22} color="#DC2626" />
              <Text style={styles.statValue}>{completedSessions}</Text>
              <Text style={styles.statLabel}>{t("home.sessions")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={22} color="#8B5CF6" />
              <Text style={styles.statValue}>
                {formatTotalTime(totalFocusTime)}
              </Text>
              <Text style={styles.statLabel}>{t("home.focusTime")}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t("home.shortcuts")}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsRow}
        >
          {quickActions.map((action) => (
            <Pressable
              key={action.key}
              style={({ pressed }) => [
                styles.quickAction,
                pressed && styles.quickActionPressed,
              ]}
              onPress={() => (navigation as any)?.navigate?.(action.route)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: action.color + "18" },
                ]}
              >
                <MaterialIcons
                  name={action.icon}
                  size={24}
                  color={action.color}
                />
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Pending Tasks Preview */}
        <Text style={styles.sectionTitle}>{t("home.pendingTasksTitle")}</Text>
        {pendingTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons
              name="task-alt"
              size={40}
              color={theme.colors.muted}
            />
            <Text style={styles.emptyText}>{t("home.allDone")}</Text>
          </View>
        ) : (
          pendingTasks.slice(0, 5).map((task) => (
            <Pressable
              key={task.id}
              style={styles.taskItem}
              onPress={() => (navigation as any)?.navigate?.("Tasks")}
            >
              <View
                style={[
                  styles.priorityDot,
                  {
                    backgroundColor:
                      task.priority === "high"
                        ? theme.colors.danger
                        : task.priority === "medium"
                        ? "#F59E0B"
                        : theme.colors.success,
                  },
                ]}
              />
              <Text style={styles.taskTitle} numberOfLines={1}>
                {task.title}
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={theme.colors.muted}
              />
            </Pressable>
          ))
        )}

        {/* Sign Out */}
        <Text onPress={signOut} style={styles.signOut}>
          {t("home.signOut")}
        </Text>
      </Animated.View>
    </Animated.ScrollView>
  );
};
