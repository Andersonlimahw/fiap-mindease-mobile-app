import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@app/presentation/theme/theme';
import { makeNotificationsStyles } from './NotificationsScreen.styles';
import {
  useNotifications,
  useUnreadCount,
  useNotificationStore,
  useNotificationLoading,
} from '@store/notificationStore';
import { useAuth } from '@store/authStore';
import { useI18n } from '@app/presentation/i18n/I18nProvider';
import type { Notification } from '@app/domain/entities/Notification';

const ICON_MAP: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  task_created: 'add-task',
  task_completed: 'task-alt',
  task_due: 'warning',
  pomodoro_completed: 'timer',
  pomodoro_goal: 'emoji-events',
  fcm: 'notifications',
};

export const NotificationsScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeNotificationsStyles(theme), [theme]);
  const notifications = useNotifications();
  const unreadCount = useUnreadCount();
  const loading = useNotificationLoading();
  const { markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const { user } = useAuth();

  const handleMarkAsRead = async (notif: Notification) => {
    if (!user?.id || notif.read) return;
    await markAsRead(user.id, notif.id);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    await markAllAsRead(user.id);
  };

  const handleDelete = async (notifId: string) => {
    if (!user?.id) return;
    await deleteNotification(user.id, notifId);
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <Pressable
      style={[styles.item, !item.read && styles.itemUnread]}
      onPress={() => handleMarkAsRead(item)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '18' }]}>
        <MaterialIcons
          name={ICON_MAP[item.type] ?? 'notifications'}
          size={22}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteBtn} hitSlop={8}>
        <MaterialIcons name="close" size={16} color={theme.colors.muted} />
      </Pressable>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <Pressable style={styles.markAllBtn} onPress={handleMarkAllAsRead}>
          <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
        </Pressable>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="notifications-none" size={56} color={theme.colors.muted} />
              <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};
