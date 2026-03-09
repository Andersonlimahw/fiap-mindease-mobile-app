import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Notification, CreateNotificationInput } from '@app/domain/entities/Notification';
import type { NotificationRepository } from '@app/domain/repositories/NotificationRepository';
import { TOKENS } from '@app/core/di/container';
import { useDIStore } from './diStore';
import { zustandSecureStorage } from '@app/infrastructure/storage/SecureStorage';

type NotificationState = {
  notifications: Notification[];
  loading: boolean;
  error: string | null;

  // Actions
  subscribe: (userId: string) => () => void;
  createNotification: (userId: string, input: CreateNotificationInput) => Promise<void>;
  markAsRead: (userId: string, notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (userId: string, notificationId: string) => Promise<void>;
  saveFcmToken: (userId: string, token: string) => Promise<void>;
  addFcmNotification: (
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) => Promise<void>;
  clearError: () => void;
};

const STORAGE_KEY = '@mindease/notifications:v1';

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      loading: false,
      error: null,

      subscribe: (userId: string) => {
        const repo = useDIStore
          .getState()
          .di.resolve<NotificationRepository>(TOKENS.NotificationRepository);

        set({ loading: true, error: null });

        const unsubscribe = repo.subscribe(userId, (notifications) => {
          set({ notifications, loading: false });
        });

        return unsubscribe;
      },

      createNotification: async (userId, input) => {
        const repo = useDIStore
          .getState()
          .di.resolve<NotificationRepository>(TOKENS.NotificationRepository);
        try {
          await repo.create(userId, input);
        } catch (e: any) {
          set({ error: e.message ?? 'Erro ao criar notificação' });
        }
      },

      markAsRead: async (userId, notificationId) => {
        const repo = useDIStore
          .getState()
          .di.resolve<NotificationRepository>(TOKENS.NotificationRepository);
        // Atualização otimista
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
        try {
          await repo.markAsRead(userId, notificationId);
        } catch (e: any) {
          set({ error: e.message ?? 'Erro ao marcar como lida' });
        }
      },

      markAllAsRead: async (userId) => {
        const repo = useDIStore
          .getState()
          .di.resolve<NotificationRepository>(TOKENS.NotificationRepository);
        // Atualização otimista
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
        try {
          await repo.markAllAsRead(userId);
        } catch (e: any) {
          set({ error: e.message ?? 'Erro ao marcar todas como lidas' });
        }
      },

      deleteNotification: async (userId, notificationId) => {
        const repo = useDIStore
          .getState()
          .di.resolve<NotificationRepository>(TOKENS.NotificationRepository);
        // Atualização otimista
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== notificationId),
        }));
        try {
          await repo.delete(userId, notificationId);
        } catch (e: any) {
          set({ error: e.message ?? 'Erro ao deletar notificação' });
        }
      },

      saveFcmToken: async (userId, token) => {
        const repo = useDIStore
          .getState()
          .di.resolve<NotificationRepository>(TOKENS.NotificationRepository);
        try {
          await repo.saveFcmToken(userId, token);
        } catch (e: any) {
          console.warn('[notificationStore] saveFcmToken error:', e);
        }
      },

      addFcmNotification: async (userId, title, body, data) => {
        const repo = useDIStore
          .getState()
          .di.resolve<NotificationRepository>(TOKENS.NotificationRepository);
        try {
          await repo.create(userId, { type: 'fcm', title, body, data });
        } catch (e: any) {
          console.warn('[notificationStore] addFcmNotification error:', e);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => zustandSecureStorage),
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);

// ============================================
// SELECTORS (optimized for performance)
// ============================================

export const useNotifications = () => useNotificationStore((s) => s.notifications);
export const useUnreadCount = () =>
  useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);
export const useNotificationLoading = () => useNotificationStore((s) => s.loading);
export const useNotificationError = () => useNotificationStore((s) => s.error);
