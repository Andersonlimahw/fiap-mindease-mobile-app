import type { UserRepository } from '@app/domain/repositories/UserRepository';
import { FirebaseAPI } from '@app/infrastructure/firebase/firebase';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from '@react-native-firebase/firestore';

/**
 * Firebase implementation of UserRepository
 * Handles user preferences and profile data
 */
export class FirebaseUserRepository implements UserRepository {
  private getDb() {
    return FirebaseAPI.db ?? getFirestore();
  }

  private getUserRef(userId: string) {
    const db = this.getDb();
    if (!userId) {
      throw new Error('User ID is required');
    }
    // As requested: users/{userId}/preferences/settings
    return doc(db, 'users', userId, 'preferences', 'settings');
  }

  async saveSettings(userId: string, settings: any): Promise<void> {
    const userRef = this.getUserRef(userId);
    await setDoc(userRef, settings, { merge: true });
  }

  async getSettings(userId: string): Promise<any | null> {
    const userRef = this.getUserRef(userId);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() : null;
  }

  subscribeSettings(userId: string, callback: (settings: any) => void): () => void {
    const userRef = this.getUserRef(userId);
    const unsub = onSnapshot(userRef, (snap: any) => {
      if (snap.exists()) {
        callback(snap.data());
      }
    });
    return unsub;
  }
}
