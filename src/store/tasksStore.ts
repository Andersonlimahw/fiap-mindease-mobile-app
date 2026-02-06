import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskPriority, TASK_PRIORITY_ORDER } from '@app/domain/entities/Task';
import type { TaskRepository } from '@app/domain/repositories/TaskRepository';
import { TOKENS } from '@app/core/di/container';
import { useDIStore } from './diStore';
import { zustandSecureStorage } from '@app/infrastructure/storage/SecureStorage';

type TasksState = {
  tasks: Task[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchTasks: (userId: string) => Promise<void>;
  addTask: (input: CreateTaskInput) => Promise<void>;
  updateTask: (id: string, updates: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  addSubTask: (taskId: string, title: string) => Promise<void>;
  toggleSubTask: (taskId: string, subTaskId: string) => Promise<void>;
  deleteSubTask: (taskId: string, subTaskId: string) => Promise<void>;
  clearError: () => void;
};

const STORAGE_KEY = '@mindease/tasks:v1';

let unsubscribe: (() => void) | undefined;

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],
      loading: false,
      error: null,

      fetchTasks: async (userId: string) => {
        const repo = useDIStore
          .getState()
          .di.resolve<TaskRepository>(TOKENS.TaskRepository);

        set({ loading: true, error: null });

        try {
          // Unsubscribe from previous subscription if any
          if (unsubscribe) {
            unsubscribe();
          }

          // Subscribe to real-time updates
          unsubscribe = repo.subscribe(userId, (tasks) => {
            set({ tasks, loading: false });
          });
        } catch (e: any) {
          console.error('[tasksStore] fetchTasks error', e);
          set({ error: e.message || 'Failed to fetch tasks', loading: false });
        }
      },

      addTask: async (input: CreateTaskInput) => {
        const repo = useDIStore
          .getState()
          .di.resolve<TaskRepository>(TOKENS.TaskRepository);

        set({ loading: true, error: null });

        try {
          await repo.create(input);
        } catch (e: any) {
          console.error('[tasksStore] addTask error', e);
          set({ error: e.message || 'Failed to add task' });
        } finally {
          set({ loading: false });
        }
      },

      updateTask: async (id: string, updates: UpdateTaskInput) => {
        const repo = useDIStore
          .getState()
          .di.resolve<TaskRepository>(TOKENS.TaskRepository);

        try {
          await repo.update(id, updates);
        } catch (e: any) {
          console.error('[tasksStore] updateTask error', e);
          set({ error: e.message || 'Failed to update task' });
        }
      },

      deleteTask: async (id: string) => {
        const repo = useDIStore
          .getState()
          .di.resolve<TaskRepository>(TOKENS.TaskRepository);

        try {
          await repo.delete(id);
        } catch (e: any) {
          console.error('[tasksStore] deleteTask error', e);
          set({ error: e.message || 'Failed to delete task' });
        }
      },

      toggleTask: async (id: string) => {
        const repo = useDIStore
          .getState()
          .di.resolve<TaskRepository>(TOKENS.TaskRepository);

        try {
          await repo.toggleTask(id);
        } catch (e: any) {
          console.error('[tasksStore] toggleTask error', e);
          set({ error: e.message || 'Failed to toggle task' });
        }
      },

      addSubTask: async (taskId: string, title: string) => {
        const repo = useDIStore
          .getState()
          .di.resolve<TaskRepository>(TOKENS.TaskRepository);

        try {
          await repo.addSubTask(taskId, title);
        } catch (e: any) {
          console.error('[tasksStore] addSubTask error', e);
          set({ error: e.message || 'Failed to add subtask' });
        }
      },

      toggleSubTask: async (taskId: string, subTaskId: string) => {
        const repo = useDIStore
          .getState()
          .di.resolve<TaskRepository>(TOKENS.TaskRepository);

        try {
          await repo.toggleSubTask(taskId, subTaskId);
        } catch (e: any) {
          console.error('[tasksStore] toggleSubTask error', e);
          set({ error: e.message || 'Failed to toggle subtask' });
        }
      },

      deleteSubTask: async (taskId: string, subTaskId: string) => {
        const repo = useDIStore
          .getState()
          .di.resolve<TaskRepository>(TOKENS.TaskRepository);

        try {
          await repo.deleteSubTask(taskId, subTaskId);
        } catch (e: any) {
          console.error('[tasksStore] deleteSubTask error', e);
          set({ error: e.message || 'Failed to delete subtask' });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => zustandSecureStorage),
      partialize: (state) => ({
        tasks: state.tasks,
      }),
    }
  )
);

// Cleanup subscription
export function teardownTasksStore() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = undefined;
  }
}

// ============================================
// SELECTORS (optimized for performance)
// ============================================

export const useTasks = () => useTasksStore((s) => s.tasks);
export const useTasksLoading = () => useTasksStore((s) => s.loading);
export const useTasksError = () => useTasksStore((s) => s.error);

// Filtered selectors
export const usePendingTasks = () =>
  useTasksStore((s) => s.tasks.filter((t) => !t.completed));

export const useCompletedTasks = () =>
  useTasksStore((s) => s.tasks.filter((t) => t.completed));

export const useTasksByPriority = (priority: TaskPriority) =>
  useTasksStore((s) => s.tasks.filter((t) => t.priority === priority));

// Task by ID selector
export const useTaskById = (id: string) =>
  useTasksStore((s) => s.tasks.find((t) => t.id === id));

// Actions selector (stable references)
export const useTasksActions = () =>
  useTasksStore((s) => ({
    fetchTasks: s.fetchTasks,
    addTask: s.addTask,
    updateTask: s.updateTask,
    deleteTask: s.deleteTask,
    toggleTask: s.toggleTask,
    addSubTask: s.addSubTask,
    toggleSubTask: s.toggleSubTask,
    deleteSubTask: s.deleteSubTask,
    clearError: s.clearError,
  }));

// Progress calculation helper
export const getTaskProgress = (task: Task): number => {
  if (task.subTasks.length === 0) return task.completed ? 100 : 0;
  const completed = task.subTasks.filter((st) => st.completed).length;
  return Math.round((completed / task.subTasks.length) * 100);
};
