import type { NotificationRepository } from '@domain/repositories/NotificationRepository';
import type { Notification, CreateNotificationInput } from '@domain/entities/Notification';

let mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'task_created',
    title: 'Nova tarefa criada',
    body: 'Revisar documentação do projeto foi adicionada.',
    read: false,
    createdAt: Date.now() - 3600000,
    data: { taskId: 'task-1' },
  },
  {
    id: 'notif-2',
    type: 'pomodoro_completed',
    title: 'Sessão Pomodoro concluída!',
    body: 'Você completou 1 sessão de foco. Continue assim!',
    read: true,
    createdAt: Date.now() - 7200000,
    data: {},
  },
];

let listeners: ((notifications: Notification[]) => void)[] = [];
let idCounter = 10;

const notify = () => {
  const sorted = [...mockNotifications].sort((a, b) => b.createdAt - a.createdAt);
  listeners.forEach((cb) => cb(sorted));
};

export class MockNotificationRepository implements NotificationRepository {
  async getAll(_userId: string): Promise<Notification[]> {
    return [...mockNotifications].sort((a, b) => b.createdAt - a.createdAt);
  }

  async create(_userId: string, input: CreateNotificationInput): Promise<Notification> {
    const notification: Notification = {
      ...input,
      id: `notif-${idCounter++}`,
      read: false,
      createdAt: Date.now(),
    };
    mockNotifications = [notification, ...mockNotifications];
    notify();
    return notification;
  }

  async markAsRead(_userId: string, notificationId: string): Promise<void> {
    mockNotifications = mockNotifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    notify();
  }

  async markAllAsRead(_userId: string): Promise<void> {
    mockNotifications = mockNotifications.map((n) => ({ ...n, read: true }));
    notify();
  }

  async delete(_userId: string, notificationId: string): Promise<void> {
    mockNotifications = mockNotifications.filter((n) => n.id !== notificationId);
    notify();
  }

  async saveFcmToken(_userId: string, _token: string): Promise<void> {
    // No-op em mock — token FCM não é necessário em ambiente de desenvolvimento
  }

  subscribe(
    _userId: string,
    callback: (notifications: Notification[]) => void
  ): () => void {
    listeners.push(callback);
    // Emitir estado inicial imediatamente
    const sorted = [...mockNotifications].sort((a, b) => b.createdAt - a.createdAt);
    callback(sorted);
    return () => {
      listeners = listeners.filter((l) => l !== callback);
    };
  }
}
