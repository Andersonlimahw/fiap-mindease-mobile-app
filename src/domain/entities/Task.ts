/**
 * Task Entity - Domain Layer
 * Represents a productivity task with subtasks for micro-steps
 */

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  subTasks: SubTask[];
  createdAt: number;
  completedAt?: number;
}

export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'completedAt'>;

export type UpdateTaskInput = Partial<
  Omit<Task, 'id' | 'userId' | 'createdAt'>
>;

export type TaskPriority = Task['priority'];

export const TASK_PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};
