import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Mock, Mocked } from 'vitest';
import { useTasksStore, getTaskProgress, teardownTasksStore } from '../tasksStore';
import { useDIStore } from '@store/diStore';
import { TOKENS } from '@app/core/di/container';
import type { Task } from '@app/domain/entities/Task';
import type { TaskRepository } from '@app/domain/repositories/TaskRepository';

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-id',
  userId: 'user-1',
  title: 'Test task',
  description: 'Testing the store',
  priority: 'medium',
  completed: false,
  subTasks: [],
  createdAt: Date.now(),
  ...overrides,
});

const createTaskRepoMock = (): Mocked<TaskRepository> => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  toggleTask: vi.fn(),
  addSubTask: vi.fn(),
  toggleSubTask: vi.fn(),
  deleteSubTask: vi.fn(),
  subscribe: vi.fn(),
}) as unknown as Mocked<TaskRepository>;

const getStateMock = useDIStore as unknown as {
  getState: Mock;
};

const mockDIWithRepo = (repo: Mocked<TaskRepository>) => {
  const resolveMock: Mock = vi.fn((token: unknown) => {
    if (token === TOKENS.TaskRepository) return repo;
    return undefined;
  });

  getStateMock.getState.mockReturnValue({
    di: { resolve: resolveMock },
  });

  return resolveMock;
};

describe('tasksStore', () => {
  let repo: Mocked<TaskRepository>;

  beforeEach(() => {
    repo = createTaskRepoMock();
    repo.subscribe.mockImplementation((_userId: string, cb: (tasks: Task[]) => void) => {
      cb([]);
      return vi.fn();
    });
    mockDIWithRepo(repo);

    useTasksStore.setState({ tasks: [], loading: false, error: null });
    teardownTasksStore();
  });

  afterEach(() => {
    teardownTasksStore();
  });

  describe('initial state', () => {
    it('should start without tasks and not loading', () => {
      const state = useTasksStore.getState();
      expect(state.tasks).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchTasks', () => {
    it('should subscribe and update tasks list', async () => {
      const sampleTasks = [createTask({ id: 't1' }), createTask({ id: 't2' })];
      repo.subscribe.mockImplementation((_userId: string, cb: (tasks: Task[]) => void) => {
        cb(sampleTasks);
        return vi.fn();
      });

      await useTasksStore.getState().fetchTasks('user-1');

      expect(repo.subscribe).toHaveBeenCalledWith('user-1', expect.any(Function));
      expect(useTasksStore.getState().tasks).toEqual(sampleTasks);
      expect(useTasksStore.getState().loading).toBe(false);
    });

    it('should expose loading state before subscription resolves', () => {
      const unsub = vi.fn();
      repo.subscribe.mockImplementation(() => unsub);

      const promise = useTasksStore.getState().fetchTasks('user-1');
      expect(useTasksStore.getState().loading).toBe(true);

      return promise;
    });

    it('should store errors when subscription fails', async () => {
      repo.subscribe.mockImplementation(() => {
        throw new Error('network down');
      });

      await useTasksStore.getState().fetchTasks('user-1');

      expect(useTasksStore.getState().error).toBe('network down');
      expect(useTasksStore.getState().loading).toBe(false);
    });

    it('should unsubscribe previous listener before a new fetch', async () => {
      const firstUnsub = vi.fn();
      const secondUnsub = vi.fn();

      repo.subscribe
        .mockImplementationOnce((_userId: string, cb: (tasks: Task[]) => void) => {
          cb([]);
          return firstUnsub;
        })
        .mockImplementationOnce((_userId: string, cb: (tasks: Task[]) => void) => {
          cb([]);
          return secondUnsub;
        });

      await useTasksStore.getState().fetchTasks('user-1');
      await useTasksStore.getState().fetchTasks('user-1');

      expect(firstUnsub).toHaveBeenCalledTimes(1);
      expect(secondUnsub).not.toHaveBeenCalled();
    });

    it('teardownTasksStore should cleanup active subscription', async () => {
      const unsub = vi.fn();
      repo.subscribe.mockImplementation((_userId: string, cb: (tasks: Task[]) => void) => {
        cb([]);
        return unsub;
      });

      await useTasksStore.getState().fetchTasks('user-1');
      teardownTasksStore();

      expect(unsub).toHaveBeenCalledTimes(1);
    });
  });

  describe('task mutations', () => {
    it('addTask should call repository and toggle loading state', async () => {
      repo.create.mockResolvedValue(createTask());

      const promise = useTasksStore.getState().addTask({
        userId: 'user-1',
        title: 'New',
        description: '',
        priority: 'high',
        completed: false,
        subTasks: [],
      });

      expect(useTasksStore.getState().loading).toBe(true);
      await promise;

      expect(repo.create).toHaveBeenCalledTimes(1);
      expect(useTasksStore.getState().loading).toBe(false);
    });

    it('addTask should capture repository errors', async () => {
      repo.create.mockRejectedValue(new Error('cannot create'));

      await useTasksStore.getState().addTask({
        userId: 'user-1',
        title: 'fail',
        description: '',
        priority: 'low',
        completed: false,
        subTasks: [],
      });

      expect(useTasksStore.getState().error).toBe('cannot create');
      expect(useTasksStore.getState().loading).toBe(false);
    });

    it('updateTask should forward updates to the repository', async () => {
      repo.update.mockResolvedValue(createTask());
      await useTasksStore.getState().updateTask('task-123', { title: 'Updated' });

      expect(repo.update).toHaveBeenCalledWith('task-123', { title: 'Updated' });
    });

    it('deleteTask should invoke repository delete', async () => {
      repo.delete.mockResolvedValue(undefined);
      await useTasksStore.getState().deleteTask('task-123');

      expect(repo.delete).toHaveBeenCalledWith('task-123');
    });

    it('toggleTask should flip completion via repository', async () => {
      repo.toggleTask.mockResolvedValue(createTask({ completed: true }));
      await useTasksStore.getState().toggleTask('task-123');

      expect(repo.toggleTask).toHaveBeenCalledWith('task-123');
    });

    it('subtask helpers should call repository implementations', async () => {
      repo.addSubTask.mockResolvedValue(createTask());
      repo.toggleSubTask.mockResolvedValue(createTask());
      repo.deleteSubTask.mockResolvedValue(createTask());

      await useTasksStore.getState().addSubTask('task-1', 'Sub task');
      await useTasksStore.getState().toggleSubTask('task-1', 'sub-1');
      await useTasksStore.getState().deleteSubTask('task-1', 'sub-1');

      expect(repo.addSubTask).toHaveBeenCalledWith('task-1', 'Sub task');
      expect(repo.toggleSubTask).toHaveBeenCalledWith('task-1', 'sub-1');
      expect(repo.deleteSubTask).toHaveBeenCalledWith('task-1', 'sub-1');
    });

    it('should set error state when mutation fails', async () => {
      repo.update.mockRejectedValue(new Error('update failed'));

      await useTasksStore.getState().updateTask('task-1', { title: 'a' });

      expect(useTasksStore.getState().error).toBe('update failed');
    });
  });

  describe('error handling helpers', () => {
    it('clearError should reset error state', () => {
      useTasksStore.setState({ error: 'boom' });
      useTasksStore.getState().clearError();
      expect(useTasksStore.getState().error).toBeNull();
    });
  });

  describe('getTaskProgress', () => {
    it('should return 0 for tasks without subtasks and not completed', () => {
      expect(getTaskProgress(createTask({ subTasks: [], completed: false }))).toBe(0);
    });

    it('should return 100 when simple task is completed', () => {
      expect(getTaskProgress(createTask({ subTasks: [], completed: true }))).toBe(100);
    });

    it('should calculate percentage based on completed subtasks', () => {
      const task = createTask({
        subTasks: [
          { id: '1', title: 'A', completed: true },
          { id: '2', title: 'B', completed: false },
          { id: '3', title: 'C', completed: true },
        ],
      });

      expect(getTaskProgress(task)).toBe(67);
    });
  });
});
