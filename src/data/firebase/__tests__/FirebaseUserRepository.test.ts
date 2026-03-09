import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirebaseUserRepository } from '../FirebaseUserRepository';
import { FirebaseAPI } from '@app/infrastructure/firebase/firebase';

const firestoreMocks = vi.hoisted(() => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock('@react-native-firebase/firestore', () => firestoreMocks);

vi.mock('@app/infrastructure/firebase/firebase', () => ({
  FirebaseAPI: { db: undefined as unknown },
}));

const mutableFirebaseAPI = FirebaseAPI as unknown as { db?: unknown };

describe('FirebaseUserRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutableFirebaseAPI.db = undefined;
    firestoreMocks.getFirestore.mockReturnValue('mock-db');
    firestoreMocks.doc.mockReturnValue('doc-ref');
  });

  it('saveSettings should use path users/{userId}/preferences/settings', async () => {
    const repo = new FirebaseUserRepository();
    const settings = { theme: 'dark' };
    
    await repo.saveSettings('user-123', settings);

    expect(firestoreMocks.doc).toHaveBeenCalledWith('mock-db', 'users', 'user-123', 'preferences', 'settings');
    expect(firestoreMocks.setDoc).toHaveBeenCalledWith('doc-ref', settings, { merge: true });
  });

  it('getSettings should fetch document from users/{userId}/preferences/settings', async () => {
    firestoreMocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ theme: 'light' }),
    });

    const repo = new FirebaseUserRepository();
    const result = await repo.getSettings('user-123');

    expect(firestoreMocks.doc).toHaveBeenCalledWith('mock-db', 'users', 'user-123', 'preferences', 'settings');
    expect(result).toEqual({ theme: 'light' });
  });

  it('subscribeSettings should listen to settings document', () => {
    const repo = new FirebaseUserRepository();
    const callback = vi.fn();
    repo.subscribeSettings('user-123', callback);

    expect(firestoreMocks.doc).toHaveBeenCalledWith('mock-db', 'users', 'user-123', 'preferences', 'settings');
    expect(firestoreMocks.onSnapshot).toHaveBeenCalledWith('doc-ref', expect.any(Function));
  });
});
