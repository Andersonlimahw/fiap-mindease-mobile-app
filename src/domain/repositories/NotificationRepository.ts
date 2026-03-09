import type { Notification, CreateNotificationInput } from '../entities/Notification';

/**
 * NotificationRepository Interface - Domain Layer
 * Defines contract for notification data operations
 */
export interface NotificationRepository {
  /** Obtém todas as notificações do usuário, ordenadas por data desc */
  getAll(userId: string): Promise<Notification[]>;
  /** Cria uma nova notificação */
  create(userId: string, input: CreateNotificationInput): Promise<Notification>;
  /** Marca uma notificação como lida */
  markAsRead(userId: string, notificationId: string): Promise<void>;
  /** Marca todas as notificações como lidas */
  markAllAsRead(userId: string): Promise<void>;
  /** Remove uma notificação */
  delete(userId: string, notificationId: string): Promise<void>;
  /** Salva/atualiza o FCM token do dispositivo no perfil do usuário */
  saveFcmToken(userId: string, token: string): Promise<void>;
  /** Assina notificações em tempo real via Firestore */
  subscribe(userId: string, callback: (notifications: Notification[]) => void): () => void;
}
