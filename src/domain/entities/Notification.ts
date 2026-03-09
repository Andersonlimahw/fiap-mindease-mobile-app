/**
 * Notification Entity - Domain Layer
 */
export type NotificationType =
  | 'task_created'
  | 'task_completed'
  | 'task_due'
  | 'pomodoro_completed'
  | 'pomodoro_goal'
  | 'fcm';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
  data?: Record<string, string>;
}

export type CreateNotificationInput = Omit<Notification, 'id' | 'createdAt' | 'read'>;
