# Tasks Feature

## Overview

The Tasks feature provides a productivity task management system with support for micro-steps (subtasks) to break down complex work into manageable pieces.

## Architecture

### Domain Layer

#### Entity: Task

```typescript
// src/domain/entities/Task.ts

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
export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>;
```

#### Repository Interface

```typescript
// src/domain/repositories/TaskRepository.ts

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
```

### Store

```typescript
// src/store/tasksStore.ts

interface TasksState {
  tasks: Task[];
  loading: boolean;
  addTask: (input: CreateTaskInput) => void;
  updateTask: (id: string, updates: UpdateTaskInput) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  addSubTask: (taskId: string, title: string) => void;
  toggleSubTask: (taskId: string, subTaskId: string) => void;
  deleteSubTask: (taskId: string, subTaskId: string) => void;
}
```

### Presentation

#### Screen: TasksScreen

Location: `src/presentation/screens/Tasks/TasksScreen.tsx`

Components:
- TaskList (FlashList for performance)
- TaskItem (individual task card)
- SubTaskItem (subtask checkbox)
- AddTaskModal (create/edit task form)
- PriorityBadge (visual priority indicator)

## User Stories

1. As a user, I can create tasks with title, description, and priority
2. As a user, I can mark tasks as complete
3. As a user, I can add subtasks to break down complex tasks
4. As a user, I can mark subtasks as complete individually
5. As a user, I can delete tasks and subtasks
6. As a user, I can edit existing tasks
7. As a user, I can see progress based on completed subtasks

## UI/UX Considerations

- Use swipe gestures for delete/edit actions (SwipeableRow component)
- Show visual progress bar based on subtask completion
- Color-coded priority badges
- Empty state when no tasks exist
- Confirmation dialog for delete actions

## Data Persistence

- Local: Zustand with MMKV SecureStorage
- Remote: Firebase Firestore (optional sync)

## Migration Notes

Web source: `.tmp/fiap-mindease-frontend-web/src/stores/useTasksStore.ts`

Key differences from web:
- Replace `crypto.randomUUID()` with uuid library or timestamp-based IDs
- Use MMKV instead of localStorage
- Add userId field for multi-user support
- Integrate with DI container pattern
