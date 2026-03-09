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

  describe('task mutations with Optimistic UI', () => {
    it('addTask should update state immediately (optimistic)', async () => {
      let resolveRepo: (value: Task) => void = () => {};
      repo.create.mockReturnValue(new Promise((resolve) => { resolveRepo = resolve; }));

      const addTaskPromise = useTasksStore.getState().addTask({
        userId: 'user-1',
        title: 'Optimistic Task',
        description: '',
        priority: 'high',
        completed: false,
        subTasks: [],
      });

      // State should be updated immediately
      const stateAfterCall = useTasksStore.getState();
      expect(stateAfterCall.tasks).toHaveLength(1);
      expect(stateAfterCall.tasks[0].title).toBe('Optimistic Task');
      expect(stateAfterCall.tasks[0].id).toMatch(/^temp-/);
      expect(stateAfterCall.loading).toBe(true);

      // Resolve repository
      resolveRepo(createTask({ title: 'Optimistic Task', id: 'real-id' }));
      await addTaskPromise;

      expect(useTasksStore.getState().loading).toBe(false);
    });

    it('addTask should rollback on failure', async () => {
      repo.create.mockRejectedValue(new Error('API Error'));
      useTasksStore.setState({ tasks: [] });

      await useTasksStore.getState().addTask({
        userId: 'user-1',
        title: 'Failed Task',
        description: '',
        priority: 'low',
        completed: false,
        subTasks: [],
      });

      expect(useTasksStore.getState().tasks).toHaveLength(0);
      expect(useTasksStore.getState().error).toBe('API Error');
    });

    it('updateTask should update state immediately', async () => {
      const initialTask = createTask({ id: 't1', title: 'Old' });
      useTasksStore.setState({ tasks: [initialTask] });

      repo.update.mockResolvedValue({ ...initialTask, title: 'New' });

      const promise = useTasksStore.getState().updateTask('t1', { title: 'New' });
      
      // Immediate update
      expect(useTasksStore.getState().tasks[0].title).toBe('New');
      
      await promise;
    });

    it('deleteTask should remove task immediately', async () => {
      const task = createTask({ id: 't1' });
      useTasksStore.setState({ tasks: [task] });

      repo.delete.mockResolvedValue(undefined);

      const promise = useTasksStore.getState().deleteTask('t1');
      
      // Immediate removal
      expect(useTasksStore.getState().tasks).toHaveLength(0);
      
      await promise;
    });

    it('toggleTask should update completion state immediately', async () => {
      const task = createTask({ id: 't1', completed: false });
      useTasksStore.setState({ tasks: [task] });

      repo.toggleTask.mockResolvedValue({ ...task, completed: true });

      const promise = useTasksStore.getState().toggleTask('t1');
      
      // Immediate toggle
      expect(useTasksStore.getState().tasks[0].completed).toBe(true);
      
      await promise;
    });

    it('addSubTask should add subtask immediately', async () => {
      const task = createTask({ id: 't1', subTasks: [] });
      useTasksStore.setState({ tasks: [task] });

      repo.addSubTask.mockResolvedValue({ ...task, subTasks: [{ id: 's1', title: 'Sub', completed: false }] });

      const promise = useTasksStore.getState().addSubTask('t1', 'Sub');
      
      // Immediate subtask
      expect(useTasksStore.getState().tasks[0].subTasks).toHaveLength(1);
      expect(useTasksStore.getState().tasks[0].subTasks[0].title).toBe('Sub');
      
      await promise;
    });

    it('toggleSubTask should update subtask completion immediately', async () => {
      const subTask = { id: 's1', title: 'Sub', completed: false };
      const task = createTask({ id: 't1', subTasks: [subTask] });
      useTasksStore.setState({ tasks: [task] });

      repo.toggleSubTask.mockResolvedValue({ ...task, subTasks: [{ ...subTask, completed: true }] });

      const promise = useTasksStore.getState().toggleSubTask('t1', 's1');
      
      // Immediate toggle
      expect(useTasksStore.getState().tasks[0].subTasks[0].completed).toBe(true);
      
      await promise;
    });

    it('deleteSubTask should remove subtask immediately', async () => {
      const subTask = { id: 's1', title: 'Sub', completed: false };
      const task = createTask({ id: 't1', subTasks: [subTask] });
      useTasksStore.setState({ tasks: [task] });

      repo.deleteSubTask.mockResolvedValue({ ...task, subTasks: [] });

      const promise = useTasksStore.getState().deleteSubTask('t1', 's1');
      
      // Immediate removal
      expect(useTasksStore.getState().tasks[0].subTasks).toHaveLength(0);
      
      await promise;
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
