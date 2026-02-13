import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Task } from '@app/domain/entities/Task';
import { FirebaseTaskRepository } from '../FirebaseTaskRepository';
import { FirebaseAPI } from '@app/infrastructure/firebase/firebase';

const firestoreMocks = vi.hoisted(() => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
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

type SnapshotDoc = {
  id: string;
  data: () => Record<string, any>;
};

const buildSnapshotDoc = (overrides: Partial<Record<string, any>> = {}): SnapshotDoc => ({
  id: overrides.id ?? 'doc-1',
  data: () => ({
    userId: 'user-1',
    title: 'Title',
    description: 'Desc',
    priority: 'medium',
    completed: false,
    subTasks: [],
    createdAt: { toMillis: () => 1700000000000 },
    ...overrides,
  }),
});

describe('FirebaseTaskRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutableFirebaseAPI.db = undefined;
    firestoreMocks.getFirestore.mockReturnValue('mock-db');
    firestoreMocks.collection.mockReturnValue('collection-ref');
    firestoreMocks.where.mockReturnValue('where-ref');
    firestoreMocks.orderBy.mockReturnValue('order-ref');
    firestoreMocks.query.mockReturnValue('query-ref');
    firestoreMocks.doc.mockReturnValue('doc-ref');
    firestoreMocks.onSnapshot.mockReturnValue(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('getAll should query firestore and parse tasks', async () => {
    const createdAt = { toMillis: () => 1710000000000 };
    const completedAt = { toMillis: () => 1710001000000 };
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        buildSnapshotDoc({
          id: 'task-1',
          createdAt,
          completedAt,
          completed: true,
          subTasks: [{ id: 'sub-1', title: 'Sub', completed: true }],
        }),
      ],
    });

    const repo = new FirebaseTaskRepository();
    const result = await repo.getAll('user-1');

    expect(firestoreMocks.collection).toHaveBeenCalledWith('mock-db', 'tasks');
    expect(firestoreMocks.where).toHaveBeenCalledWith('userId', '==', 'user-1');
    expect(firestoreMocks.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    expect(result).toEqual([
      expect.objectContaining({
        id: 'task-1',
        createdAt: createdAt.toMillis(),
        completedAt: completedAt.toMillis(),
        subTasks: [{ id: 'sub-1', title: 'Sub', completed: true }],
      }),
    ]);
  });

  it('getById should return null when document is missing', async () => {
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });

    const repo = new FirebaseTaskRepository();
    const result = await repo.getById('task-404');

    expect(firestoreMocks.doc).toHaveBeenCalledWith('mock-db', 'tasks', 'task-404');
    expect(result).toBeNull();
  });

  it('getById should parse existing document', async () => {
    const createdAt = { toMillis: () => 1700005000000 };
    firestoreMocks.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'task-123',
      data: () => ({
        userId: 'user-1',
        title: 'Task',
        description: '',
        priority: 'high',
        completed: false,
        subTasks: [],
        createdAt,
      }),
    });

    const repo = new FirebaseTaskRepository();
    const task = await repo.getById('task-123');

    expect(task).toEqual(
      expect.objectContaining({
        id: 'task-123',
        createdAt: createdAt.toMillis(),
      }),
    );
  });

  it('create should persist data with server timestamp and return task shape', async () => {
    mutableFirebaseAPI.db = { name: 'pre-configured' } as any;
    firestoreMocks.addDoc.mockResolvedValue({ id: 'firebase-id' });
    const input = {
      userId: 'user-1',
      title: 'New',
      description: 'Desc',
      priority: 'low' as const,
      completed: false,
      subTasks: [],
    };

    const repo = new FirebaseTaskRepository();
    const result = await repo.create(input);

    expect(firestoreMocks.getFirestore).not.toHaveBeenCalled();
    expect(firestoreMocks.addDoc).toHaveBeenCalledWith('collection-ref', {
      ...input,
      createdAt: 'SERVER_TS',
    });
    expect(result).toMatchObject({
      id: 'firebase-id',
      title: 'New',
      userId: 'user-1',
    });
    expect(typeof result.createdAt).toBe('number');
  });

  it('update should merge fields and append completedAt when finishing task', async () => {
    const updatedSnapshot = buildSnapshotDoc({
      id: 'task-1',
      title: 'Updated',
      completed: true,
    });
    firestoreMocks.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'task-1',
      data: updatedSnapshot.data,
    });

    const repo = new FirebaseTaskRepository();
    const result = await repo.update('task-1', { title: 'Updated', completed: true });

    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith('doc-ref', {
      title: 'Updated',
      completed: true,
      completedAt: 'SERVER_TS',
    });
    expect(result).toEqual(expect.objectContaining({ title: 'Updated', completed: true }));
  });

  it('delete should remove document from collection', async () => {
    const repo = new FirebaseTaskRepository();
    await repo.delete('task-1');

    expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith('doc-ref');
  });

  it('subscribe should forward realtime updates and return unsubscriber', () => {
    const unsub = vi.fn();
    firestoreMocks.onSnapshot.mockImplementation((_query, cb) => {
      cb({
        docs: [
          buildSnapshotDoc({ id: 'task-10' }),
        ],
      });
      return unsub;
    });

    const repo = new FirebaseTaskRepository();
    const callback = vi.fn();
    const teardown = repo.subscribe('user-1', callback);

    expect(firestoreMocks.onSnapshot).toHaveBeenCalledWith('query-ref', expect.any(Function));
    expect(callback).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'task-10' }),
    ]);

    teardown();
    expect(unsub).toHaveBeenCalledTimes(1);
  });

  it('toggleTask should flip completion state and set timestamps', async () => {
    const repo = new FirebaseTaskRepository();
    const getByIdSpy = vi
      .spyOn(repo, 'getById')
      .mockResolvedValueOnce({
        id: 'task-1',
        userId: 'user-1',
        title: 'Task',
        description: '',
        priority: 'medium',
        completed: false,
        subTasks: [],
        createdAt: 1,
      } as Task);
    const updateSpy = vi
      .spyOn(repo, 'update')
      .mockResolvedValue({ id: 'task-1' } as Task);

    await repo.toggleTask('task-1');

    expect(getByIdSpy).toHaveBeenCalledWith('task-1');
    expect(updateSpy).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({
        completed: true,
        completedAt: expect.any(Number),
      }),
    );
  });

  it('toggleTask should remove completedAt when reopening tasks', async () => {
    const repo = new FirebaseTaskRepository();
    const getByIdSpy = vi
      .spyOn(repo, 'getById')
      .mockResolvedValueOnce({
        id: 'task-1',
        userId: 'user-1',
        title: 'Task',
        description: '',
        priority: 'medium',
        completed: true,
        subTasks: [],
        createdAt: 1,
      } as Task);
    const updateSpy = vi
      .spyOn(repo, 'update')
      .mockResolvedValue({ id: 'task-1' } as Task);

    await repo.toggleTask('task-1');

    const payload = updateSpy.mock.calls[0][1];
    expect(payload.completed).toBe(false);
    expect(payload.completedAt).toBeUndefined();
    expect(getByIdSpy).toHaveBeenCalled();
  });

  it('addSubTask should append a new subtask via update', async () => {
    const repo = new FirebaseTaskRepository();
    const existingTask: Task = {
      id: 'task-1',
      userId: 'user-1',
      title: 'Task',
      description: '',
      priority: 'medium',
      completed: false,
      subTasks: [{ id: 'sub-1', title: 'Old', completed: false }],
      createdAt: 1,
    };
    vi.spyOn(repo, 'getById').mockResolvedValue(existingTask);
    const updateSpy = vi.spyOn(repo, 'update').mockResolvedValue(existingTask);

    await repo.addSubTask('task-1', 'New sub');

    const payload = updateSpy.mock.calls[0][1] as { subTasks?: Task['subTasks'] };
    const subTasks = payload.subTasks ?? [];
    expect(subTasks).toHaveLength(2);
    expect(subTasks[1]).toMatchObject({ title: 'New sub', completed: false });
  });

  it('toggleSubTask should invert completion flag for the matched subtask', async () => {
    const repo = new FirebaseTaskRepository();
    const existingTask: Task = {
      id: 'task-1',
      userId: 'user-1',
      title: 'Task',
      description: '',
      priority: 'medium',
      completed: false,
      subTasks: [
        { id: 'sub-1', title: 'Old', completed: false },
        { id: 'sub-2', title: 'Another', completed: true },
      ],
      createdAt: 1,
    };
    vi.spyOn(repo, 'getById').mockResolvedValue(existingTask);
    const updateSpy = vi.spyOn(repo, 'update').mockResolvedValue(existingTask);

    await repo.toggleSubTask('task-1', 'sub-2');

    const payload = updateSpy.mock.calls[0][1] as { subTasks?: Task['subTasks'] };
    const toggled = (payload.subTasks ?? []).find((st) => st.id === 'sub-2');
    expect(toggled?.completed).toBe(false);
  });

  it('deleteSubTask should remove target subtask', async () => {
    const repo = new FirebaseTaskRepository();
    const existingTask: Task = {
      id: 'task-1',
      userId: 'user-1',
      title: 'Task',
      description: '',
      priority: 'medium',
      completed: false,
      subTasks: [
        { id: 'sub-1', title: 'Old', completed: false },
        { id: 'sub-2', title: 'Another', completed: true },
      ],
      createdAt: 1,
    };
    vi.spyOn(repo, 'getById').mockResolvedValue(existingTask);
    const updateSpy = vi.spyOn(repo, 'update').mockResolvedValue(existingTask);

    await repo.deleteSubTask('task-1', 'sub-1');

    const payload = updateSpy.mock.calls[0][1] as { subTasks?: Task['subTasks'] };
    const subTasks = payload.subTasks ?? [];
    expect(subTasks).toHaveLength(1);
    expect(subTasks[0].id).toBe('sub-2');
  });
});
