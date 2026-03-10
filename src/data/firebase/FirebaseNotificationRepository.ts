import type { NotificationRepository } from '@domain/repositories/NotificationRepository';
import type { Notification, CreateNotificationInput } from '@domain/entities/Notification';
import { FirebaseAPI } from '@infrastructure/firebase/firebase';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  arrayUnion,
} from '@react-native-firebase/firestore';

/**
 * Firebase implementation of NotificationRepository.
 * Collection path: users/{userId}/notifications/{notifId}
 * FCM tokens stored in: users/{userId}.fcmTokens (array)
 */
export class FirebaseNotificationRepository implements NotificationRepository {
  private getDb() {
    return FirebaseAPI.db ?? getFirestore();
  }

  private getNotificationsCollection(userId: string) {
    return collection(this.getDb(), 'users', userId, 'notifications');
  }

  private parseNotification(id: string, data: any): Notification {
    return {
      id,
      type: data.type ?? 'fcm',
      title: data.title ?? '',
      body: data.body ?? '',
      read: data.read ?? false,
      createdAt:
        typeof data.createdAt?.toMillis === 'function'
          ? data.createdAt.toMillis()
          : Date.now(),
      data: data.data ?? {},
    };
  }

  async getAll(userId: string): Promise<Notification[]> {
    const col = this.getNotificationsCollection(userId);
    const q = query(col, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => this.parseNotification(d.id, d.data()));
  }

  async create(userId: string, input: CreateNotificationInput): Promise<Notification> {
    const col = this.getNotificationsCollection(userId);
    const payload = {
      ...input,
      read: false,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(col, payload);
    return {
      id: ref.id,
      ...input,
      read: false,
      createdAt: Date.now(),
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(ref, { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const col = this.getNotificationsCollection(userId);
    const q = query(col, where('read', '==', false));
    const snap = await getDocs(q);
    if (snap.docs.length === 0) return;
    const db = this.getDb();
    const batch = writeBatch(db);
    snap.docs.forEach((d: any) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  }

  async delete(userId: string, notificationId: string): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, 'users', userId, 'notifications', notificationId);
    await deleteDoc(ref);
  }

  async saveFcmToken(userId: string, token: string): Promise<void> {
    const db = this.getDb();
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { fcmTokens: arrayUnion(token) });
  }

  subscribe(
    userId: string,
    callback: (notifications: Notification[]) => void
  ): () => void {
    const col = this.getNotificationsCollection(userId);
    const q = query(col, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap: any) => {
      const notifications = snap.docs.map((d: any) =>
        this.parseNotification(d.id, d.data())
      );
      callback(notifications);
    });
    return unsubscribe;
  }
}
