import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore } from '../notificationStore';
import type { Notification } from '@app/domain/entities/Notification';

const mockRepo = {
  getAll: vi.fn(),
  create: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  delete: vi.fn(),
  saveFcmToken: vi.fn(),
  subscribe: vi.fn(),
};

vi.mock('../diStore', () => ({
  useDIStore: {
    getState: vi.fn(() => ({
      di: { resolve: vi.fn(() => mockRepo) },
    })),
  },
}));

vi.mock('@app/infrastructure/storage/SecureStorage', () => ({
  zustandSecureStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const sampleNotif: Notification = {
  id: 'n1',
  type: 'task_created',
  title: 'Tarefa criada',
  body: 'Nova tarefa adicionada.',
  read: false,
  createdAt: 1700000000000,
  data: {},
};

describe('notificationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotificationStore.setState({
      notifications: [],
      loading: false,
      error: null,
    });
  });

  describe('subscribe', () => {
    it('registra listener e atualiza notifications via callback', () => {
      let capturedCb: ((n: Notification[]) => void) | null = null;
      mockRepo.subscribe.mockImplementation(
        (_uid: string, cb: (n: Notification[]) => void) => {
          capturedCb = cb;
          return vi.fn();
        }
      );

      useNotificationStore.getState().subscribe('user-1');
      expect(mockRepo.subscribe).toHaveBeenCalledWith('user-1', expect.any(Function));

      capturedCb!([sampleNotif]);
      expect(useNotificationStore.getState().notifications).toHaveLength(1);
      expect(useNotificationStore.getState().notifications[0].id).toBe('n1');
      expect(useNotificationStore.getState().loading).toBe(false);
    });

    it('retorna função de unsubscribe', () => {
      const unsubFn = vi.fn();
      mockRepo.subscribe.mockReturnValue(unsubFn);

      const unsub = useNotificationStore.getState().subscribe('user-1');
      unsub();
      expect(unsubFn).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('atualiza otimisticamente e chama repo.markAsRead', async () => {
      useNotificationStore.setState({ notifications: [sampleNotif] });
      mockRepo.markAsRead.mockResolvedValue(undefined);

      await useNotificationStore.getState().markAsRead('user-1', 'n1');

      expect(useNotificationStore.getState().notifications[0].read).toBe(true);
      expect(mockRepo.markAsRead).toHaveBeenCalledWith('user-1', 'n1');
    });
  });

  describe('markAllAsRead', () => {
    it('marca todas as notificações como lidas otimisticamente', async () => {
      useNotificationStore.setState({
        notifications: [
          sampleNotif,
          { ...sampleNotif, id: 'n2', read: false },
        ],
      });
      mockRepo.markAllAsRead.mockResolvedValue(undefined);

      await useNotificationStore.getState().markAllAsRead('user-1');

      const all = useNotificationStore.getState().notifications;
      expect(all.every((n) => n.read)).toBe(true);
      expect(mockRepo.markAllAsRead).toHaveBeenCalledWith('user-1');
    });
  });

  describe('deleteNotification', () => {
    it('remove notificação otimisticamente e chama repo.delete', async () => {
      useNotificationStore.setState({ notifications: [sampleNotif] });
      mockRepo.delete.mockResolvedValue(undefined);

      await useNotificationStore.getState().deleteNotification('user-1', 'n1');

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
      expect(mockRepo.delete).toHaveBeenCalledWith('user-1', 'n1');
    });
  });

  describe('saveFcmToken', () => {
    it('chama repo.saveFcmToken com userId e token', async () => {
      mockRepo.saveFcmToken.mockResolvedValue(undefined);

      await useNotificationStore.getState().saveFcmToken('user-1', 'fcm-token-abc');

      expect(mockRepo.saveFcmToken).toHaveBeenCalledWith('user-1', 'fcm-token-abc');
    });
  });

  describe('addFcmNotification', () => {
    it('chama repo.create com tipo fcm', async () => {
      mockRepo.create.mockResolvedValue({
        id: 'new-id',
        type: 'fcm',
        title: 'Push',
        body: 'Mensagem FCM',
        read: false,
        createdAt: Date.now(),
      });

      await useNotificationStore
        .getState()
        .addFcmNotification('user-1', 'Push', 'Mensagem FCM', { key: 'val' });

      expect(mockRepo.create).toHaveBeenCalledWith('user-1', {
        type: 'fcm',
        title: 'Push',
        body: 'Mensagem FCM',
        data: { key: 'val' },
      });
    });
  });

  describe('selectors', () => {
    it('useUnreadCount retorna contagem de não lidas', () => {
      useNotificationStore.setState({
        notifications: [
          sampleNotif,
          { ...sampleNotif, id: 'n2', read: true },
          { ...sampleNotif, id: 'n3', read: false },
        ],
      });
      const unread = useNotificationStore
        .getState()
        .notifications.filter((n) => !n.read).length;
      expect(unread).toBe(2);
    });

    it('clearError limpa o erro do estado', () => {
      useNotificationStore.setState({ error: 'Erro anterior' });
      useNotificationStore.getState().clearError();
      expect(useNotificationStore.getState().error).toBeNull();
    });
  });
});
