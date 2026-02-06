import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
} from '../entities/Task';

/**
 * TaskRepository Interface - Domain Layer
 * Defines contract for task data operations
 */
export interface TaskRepository {
  getAll(userId: string): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, input: UpdateTaskInput): Promise<Task>;
  delete(id: string): Promise<void>;
  toggleTask(id: string): Promise<Task>;
  addSubTask(taskId: string, title: string): Promise<Task>;
  toggleSubTask(taskId: string, subTaskId: string): Promise<Task>;
  deleteSubTask(taskId: string, subTaskId: string): Promise<Task>;
  subscribe(userId: string, callback: (tasks: Task[]) => void): () => void;
}
