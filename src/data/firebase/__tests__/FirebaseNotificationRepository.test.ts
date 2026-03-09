import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirebaseNotificationRepository } from '../FirebaseNotificationRepository';
import { FirebaseAPI } from '@app/infrastructure/firebase/firebase';

const firestoreMocks = vi.hoisted(() => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  writeBatch: vi.fn(),
  arrayUnion: vi.fn((v) => ({ __arrayUnion: v })),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
}));

vi.mock('@react-native-firebase/firestore', () => firestoreMocks);

vi.mock('@app/infrastructure/firebase/firebase', () => ({
  FirebaseAPI: {
    db: undefined as unknown,
  },
}));

const mutableFirebaseAPI = FirebaseAPI as unknown as { db?: unknown };

describe('FirebaseNotificationRepository', () => {
  let repo: FirebaseNotificationRepository;
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
    mutableFirebaseAPI.db = undefined;
    firestoreMocks.getFirestore.mockReturnValue('mock-db');
    firestoreMocks.collection.mockReturnValue('col-ref');
    firestoreMocks.query.mockReturnValue('query-ref');
    firestoreMocks.orderBy.mockReturnValue('orderBy-ref');
    firestoreMocks.where.mockReturnValue('where-ref');
    repo = new FirebaseNotificationRepository();
  });

  it('getAll retorna lista de notificações parseadas', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        {
          id: 'n1',
          data: () => ({
            type: 'task_created',
            title: 'Tarefa criada',
            body: 'Corpo da notificação',
            read: false,
            createdAt: { toMillis: () => 1700000000000 },
            data: { taskId: 'task-1' },
          }),
        },
      ],
    });

    const result = await repo.getAll(userId);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'n1',
      type: 'task_created',
      title: 'Tarefa criada',
      read: false,
      createdAt: 1700000000000,
    });
  });

  it('getAll usa coleção users/{userId}/notifications ordenada por createdAt desc', async () => {
    firestoreMocks.getDocs.mockResolvedValue({ docs: [] });

    await repo.getAll(userId);

    expect(firestoreMocks.collection).toHaveBeenCalledWith('mock-db', 'users', userId, 'notifications');
    expect(firestoreMocks.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(firestoreMocks.query).toHaveBeenCalledWith('col-ref', 'orderBy-ref');
    expect(firestoreMocks.getDocs).toHaveBeenCalledWith('query-ref');
  });

  it('getAll retorna lista vazia quando não há notificações', async () => {
    firestoreMocks.getDocs.mockResolvedValue({ docs: [] });
    const result = await repo.getAll(userId);
    expect(result).toEqual([]);
  });

  it('getAll usa FirebaseAPI.db quando disponível', async () => {
    mutableFirebaseAPI.db = { name: 'pre-configured' } as any;
    firestoreMocks.getDocs.mockResolvedValue({ docs: [] });

    await repo.getAll(userId);

    expect(firestoreMocks.collection).toHaveBeenCalledWith(
      { name: 'pre-configured' },
      'users',
      userId,
      'notifications',
    );
    expect(firestoreMocks.getFirestore).not.toHaveBeenCalled();
  });

  it('getAll parseia createdAt como Date.now() quando toMillis não está disponível', async () => {
    const before = Date.now();
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        {
          id: 'n2',
          data: () => ({
            type: 'fcm',
            title: 'Sem timestamp',
            body: '',
            read: true,
            createdAt: null,
          }),
        },
      ],
    });

    const result = await repo.getAll(userId);
    const after = Date.now();

    expect(result[0].createdAt).toBeGreaterThanOrEqual(before);
    expect(result[0].createdAt).toBeLessThanOrEqual(after);
  });

  it('create adiciona documento e retorna notificação com id', async () => {
    firestoreMocks.addDoc.mockResolvedValue({ id: 'new-notif-id' });

    const result = await repo.create(userId, {
      type: 'fcm',
      title: 'Teste',
      body: 'Corpo do teste',
    });

    expect(firestoreMocks.addDoc).toHaveBeenCalledOnce();
    expect(result.id).toBe('new-notif-id');
    expect(result.read).toBe(false);
    expect(result.type).toBe('fcm');
  });

  it('create persiste payload com serverTimestamp e read false', async () => {
    firestoreMocks.addDoc.mockResolvedValue({ id: 'notif-abc' });

    await repo.create(userId, {
      type: 'task_created',
      title: 'Nova tarefa',
      body: 'Detalhes',
    });

    expect(firestoreMocks.addDoc).toHaveBeenCalledWith(
      'col-ref',
      expect.objectContaining({
        type: 'task_created',
        title: 'Nova tarefa',
        body: 'Detalhes',
        read: false,
        createdAt: 'SERVER_TS',
      }),
    );
  });

  it('create retorna createdAt como número (Date.now)', async () => {
    const before = Date.now();
    firestoreMocks.addDoc.mockResolvedValue({ id: 'n3' });

    const result = await repo.create(userId, {
      type: 'fcm',
      title: 'T',
      body: 'B',
    });

    const after = Date.now();
    expect(typeof result.createdAt).toBe('number');
    expect(result.createdAt).toBeGreaterThanOrEqual(before);
    expect(result.createdAt).toBeLessThanOrEqual(after);
  });

  it('markAsRead atualiza documento com read true', async () => {
    firestoreMocks.doc.mockReturnValue('doc-ref');
    firestoreMocks.updateDoc.mockResolvedValue(undefined);

    await repo.markAsRead(userId, 'n1');

    expect(firestoreMocks.doc).toHaveBeenCalledWith('mock-db', 'users', userId, 'notifications', 'n1');
    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith('doc-ref', { read: true });
  });

  it('markAllAsRead usa writeBatch para notificações não lidas', async () => {
    const mockBatch = { update: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
    firestoreMocks.writeBatch.mockReturnValue(mockBatch);
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        { ref: 'ref-1' },
        { ref: 'ref-2' },
      ],
    });

    await repo.markAllAsRead(userId);

    expect(mockBatch.update).toHaveBeenCalledTimes(2);
    expect(mockBatch.update).toHaveBeenCalledWith('ref-1', { read: true });
    expect(mockBatch.update).toHaveBeenCalledWith('ref-2', { read: true });
    expect(mockBatch.commit).toHaveBeenCalled();
  });

  it('markAllAsRead filtra por read == false via where', async () => {
    const mockBatch = { update: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
    firestoreMocks.writeBatch.mockReturnValue(mockBatch);
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [{ ref: 'ref-1' }],
    });

    await repo.markAllAsRead(userId);

    expect(firestoreMocks.where).toHaveBeenCalledWith('read', '==', false);
    expect(firestoreMocks.query).toHaveBeenCalledWith('col-ref', 'where-ref');
  });

  it('markAllAsRead não faz nada quando não há notificações não lidas', async () => {
    const mockBatch = { update: vi.fn(), commit: vi.fn() };
    firestoreMocks.writeBatch.mockReturnValue(mockBatch);
    firestoreMocks.getDocs.mockResolvedValue({ docs: [] });

    await repo.markAllAsRead(userId);

    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  it('delete chama deleteDoc com ref correta', async () => {
    firestoreMocks.doc.mockReturnValue('doc-ref');
    firestoreMocks.deleteDoc.mockResolvedValue(undefined);

    await repo.delete(userId, 'n1');

    expect(firestoreMocks.doc).toHaveBeenCalledWith('mock-db', 'users', userId, 'notifications', 'n1');
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith('doc-ref');
  });

  it('saveFcmToken chama updateDoc com arrayUnion', async () => {
    firestoreMocks.doc.mockReturnValue('user-doc-ref');
    firestoreMocks.updateDoc.mockResolvedValue(undefined);

    await repo.saveFcmToken(userId, 'fcm-token-xyz');

    expect(firestoreMocks.doc).toHaveBeenCalledWith('mock-db', 'users', userId);
    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith('user-doc-ref', {
      fcmTokens: { __arrayUnion: 'fcm-token-xyz' },
    });
  });

  it('saveFcmToken usa arrayUnion para não duplicar tokens', async () => {
    firestoreMocks.doc.mockReturnValue('user-doc-ref');
    firestoreMocks.updateDoc.mockResolvedValue(undefined);

    await repo.saveFcmToken(userId, 'token-abc');

    expect(firestoreMocks.arrayUnion).toHaveBeenCalledWith('token-abc');
  });

  it('subscribe registra onSnapshot e retorna função de cleanup', () => {
    const unsubFn = vi.fn();
    firestoreMocks.onSnapshot.mockReturnValue(unsubFn);
    const callback = vi.fn();

    const unsub = repo.subscribe(userId, callback);

    expect(firestoreMocks.onSnapshot).toHaveBeenCalledOnce();
    unsub();
    expect(unsubFn).toHaveBeenCalledOnce();
  });

  it('subscribe usa coleção users/{userId}/notifications ordenada por createdAt desc', () => {
    firestoreMocks.onSnapshot.mockReturnValue(vi.fn());

    repo.subscribe(userId, vi.fn());

    expect(firestoreMocks.collection).toHaveBeenCalledWith('mock-db', 'users', userId, 'notifications');
    expect(firestoreMocks.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(firestoreMocks.onSnapshot).toHaveBeenCalledWith('query-ref', expect.any(Function));
  });

  it('subscribe chama callback com notificações parseadas ao receber snapshot', () => {
    let capturedSnapshotHandler: ((snap: any) => void) | null = null;
    firestoreMocks.onSnapshot.mockImplementation(
      (_query: any, handler: (snap: any) => void) => {
        capturedSnapshotHandler = handler;
        return vi.fn();
      },
    );
    const callback = vi.fn();

    repo.subscribe(userId, callback);

    capturedSnapshotHandler!({
      docs: [
        {
          id: 'n1',
          data: () => ({
            type: 'pomodoro_completed',
            title: 'Sessão concluída',
            body: 'Parabéns!',
            read: false,
            createdAt: { toMillis: () => 1000 },
          }),
        },
      ],
    });

    expect(callback).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'n1', type: 'pomodoro_completed' }),
    ]);
  });

  it('subscribe chama callback com lista vazia quando snapshot está vazio', () => {
    let capturedSnapshotHandler: ((snap: any) => void) | null = null;
    firestoreMocks.onSnapshot.mockImplementation(
      (_query: any, handler: (snap: any) => void) => {
        capturedSnapshotHandler = handler;
        return vi.fn();
      },
    );
    const callback = vi.fn();

    repo.subscribe(userId, callback);
    capturedSnapshotHandler!({ docs: [] });

    expect(callback).toHaveBeenCalledWith([]);
  });
});
