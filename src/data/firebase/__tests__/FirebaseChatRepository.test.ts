import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirebaseChatRepository } from '../FirebaseChatRepository';
import { FirebaseAPI } from '../infrastructure/firebase/firebase';

const firestoreMocks = vi.hoisted(() => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn(),
  deleteDoc: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
}));

vi.mock('@react-native-firebase/firestore', () => firestoreMocks);

vi.mock('@app/infrastructure/firebase/firebase', () => ({
  FirebaseAPI: { db: undefined as unknown },
}));

const mutableFirebaseAPI = FirebaseAPI as unknown as { db?: unknown };

describe('FirebaseChatRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutableFirebaseAPI.db = undefined;
    firestoreMocks.getFirestore.mockReturnValue('mock-db');
    firestoreMocks.collection.mockReturnValue('collection-ref');
    firestoreMocks.orderBy.mockReturnValue('order-ref');
    firestoreMocks.query.mockReturnValue('query-ref');
    firestoreMocks.doc.mockReturnValue('doc-ref');
  });

  it('getMessages should use subcollection users/{userId}/chats', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        {
          id: 'msg-1',
          data: () => ({
            role: 'user',
            content: 'Hello',
            timestamp: { toMillis: () => 1000 },
          }),
        },
      ],
    });

    const repo = new FirebaseChatRepository();
    const result = await repo.getMessages('user-123');

    expect(firestoreMocks.collection).toHaveBeenCalledWith('mock-db', 'users', 'user-123', 'chats');
    expect(firestoreMocks.orderBy).toHaveBeenCalledWith('timestamp', 'asc');
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Hello');
  });

  it('sendMessage should save message but throw error if AI not implemented', async () => {
    const repo = new FirebaseChatRepository();
    const messages = [{ id: '1', role: 'user', content: 'Hi', timestamp: Date.now() }];
    
    // It should throw because AI part is not implemented in FirebaseChatRepository yet
    await expect(repo.sendMessage('user-123', messages as any, '')).rejects.toThrow('Firebase Cloud AI not implemented');

    expect(firestoreMocks.collection).toHaveBeenCalledWith('mock-db', 'users', 'user-123', 'chats');
    // Should call setDoc for user message (since it has an ID)
    expect(firestoreMocks.setDoc).toHaveBeenCalledWith('doc-ref', expect.objectContaining({
      role: 'user',
      content: 'Hi',
      timestamp: 'SERVER_TS'
    }));
  });

  it('deleteMessage should use full path to document', async () => {
    const repo = new FirebaseChatRepository();
    await repo.deleteMessage('msg-abc', 'user-123');

    expect(firestoreMocks.doc).toHaveBeenCalledWith('mock-db', 'users', 'user-123', 'chats', 'msg-abc');
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith('doc-ref');
  });

  it('clearMessages should delete all docs in subcollection', async () => {
    const mockDoc = { ref: 'doc-ref-1' };
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [mockDoc],
    });

    const repo = new FirebaseChatRepository();
    await repo.clearMessages('user-123');

    expect(firestoreMocks.getDocs).toHaveBeenCalledWith('collection-ref');
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith('doc-ref-1');
  });

  it('subscribe should listen to subcollection', () => {
    const repo = new FirebaseChatRepository();
    repo.subscribe('user-123', vi.fn());

    expect(firestoreMocks.collection).toHaveBeenCalledWith('mock-db', 'users', 'user-123', 'chats');
    expect(firestoreMocks.onSnapshot).toHaveBeenCalledWith('query-ref', expect.any(Function));
  });
});
