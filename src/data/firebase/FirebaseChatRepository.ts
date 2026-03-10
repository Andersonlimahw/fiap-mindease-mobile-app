import type { ChatRepository } from '@app/domain/repositories/ChatRepository';
import type {
  ChatMessage,
  ChatResponse,
} from '@app/domain/entities/ChatMessage';
import { FirebaseAPI } from '@app/infrastructure/firebase/firebase';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from '@react-native-firebase/firestore';

const COLLECTION_NAME = 'chats';

/**
 * Firebase implementation of ChatRepository
 * Stores and retrieves chat message history for users
 * Falls back to demo responses if needed
 */
export class FirebaseChatRepository implements ChatRepository {
  private getDb() {
    return FirebaseAPI.db ?? getFirestore();
  }

  private getChatCollection(userId: string) {
    const db = this.getDb();
    if (!userId) {
      throw new Error('User ID is required');
    }
    return collection(db, 'users', userId, COLLECTION_NAME);
  }

  private parseChatMessage(id: string, data: any): ChatMessage {
    const timestamp = data.timestamp?.toMillis
      ? data.timestamp.toMillis()
      : Number(data.timestamp) || Date.now();

    return {
      id,
      role: data.role,
      content: data.content,
      timestamp,
    };
  }

  /**
   * Send a message to the chat (store in Firebase and get AI response)
   * In a real scenario, this would integrate with an AI service via Cloud Functions
   */
  async sendMessage(
    userId: string,
    messages: ChatMessage[],
    _systemPrompt: string
  ): Promise<ChatResponse> {
    const chatColl = this.getChatCollection(userId);

    // Extract the last user message
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop();

    if (!lastUserMsg) {
      throw new Error('No user message found');
    }

    // Store user message in Firebase if not already there (id check would be better)
    // For now, we assume the caller might have already saved it or we save it here
    await this.saveMessage(userId, lastUserMsg);

    // In production, call a Cloud Function to get AI response
    // Since we don't have a Cloud Function yet, we'll throw to allow fallback
    // unless a URL is configured (we can add this to AppConfig later)
    throw new Error('Firebase Cloud AI not implemented. Falling back to next provider.');
  }

  /**
   * Saves a single message to the chat history
   */
  async saveMessage(userId: string, message: Partial<ChatMessage>): Promise<string> {
    const chatColl = this.getChatCollection(userId);
    const db = this.getDb();
    
    const messageData = {
      role: message.role || 'user',
      content: message.content || '',
      timestamp: serverTimestamp(),
    };

    if (message.id) {
      const docRef = doc(db, 'users', userId, COLLECTION_NAME, message.id);
      await setDoc(docRef, messageData);
      return message.id;
    } else {
      const docRef = await addDoc(chatColl, messageData);
      return docRef.id;
    }
  }

  /**
   * Get all chat messages for a user
   */
  async getMessages(userId: string): Promise<ChatMessage[]> {
    const chatColl = this.getChatCollection(userId);
    const q = query(chatColl, orderBy('timestamp', 'asc'));

    const snap = await getDocs(q);
    return snap?.docs.map((d: any) => this.parseChatMessage(d.id, d.data())) || [];
  }

  /**
   * Subscribe to real-time chat messages
   */
  subscribe(
    userId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const chatColl = this.getChatCollection(userId);
    const q = query(chatColl, orderBy('timestamp', 'asc'));

    const unsub = onSnapshot(q, (snap: any) => {
      const messages =
        snap?.docs.map((d: any) => this.parseChatMessage(d.id, d.data())) || [];
      callback(messages);
    });

    return unsub;
  }

  /**
   * Delete a message
   * Note: This now requires userId to find the correct document in the subcollection
   */
  async deleteMessage(id: string, userId?: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required for subcollection deletion');
    }
    const db = this.getDb();
    const docRef = doc(db, 'users', userId, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }

  /**
   * Clear all messages for a user
   */
  async clearMessages(userId: string): Promise<void> {
    const chatColl = this.getChatCollection(userId);
    const snap = await getDocs(chatColl);
    for (const doc_ of snap.docs) {
      await deleteDoc(doc_.ref);
    }
  }
}
