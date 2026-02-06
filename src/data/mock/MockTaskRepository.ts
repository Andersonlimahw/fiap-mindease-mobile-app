import type { TaskRepository } from '@app/domain/repositories/TaskRepository';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  SubTask,
} from '@app/domain/entities/Task';

let mockTasks: Task[] = [];
let listeners: ((tasks: Task[]) => void)[] = [];
let idCounter = 1;

const generateId = (): string => {
  return `task-${Date.now()}-${idCounter++}`;
};

const notify = () => {
  listeners.forEach((cb) => cb([...mockTasks]));
};

// Seed with demo tasks
const seedDemoTasks = (userId: string) => {
  if (mockTasks.length === 0) {
    mockTasks = [
      {
        id: generateId(),
        userId,
        title: 'Revisar documentação do projeto',
        description: 'Verificar se toda a documentação está atualizada',
        priority: 'high',
        completed: false,
        subTasks: [
          { id: 'sub-1', title: 'Verificar README', completed: true },
          { id: 'sub-2', title: 'Atualizar diagramas', completed: false },
        ],
        createdAt: Date.now() - 86400000,
      },
      {
        id: generateId(),
        userId,
        title: 'Implementar testes unitários',
        description: 'Adicionar cobertura de testes para os stores',
        priority: 'medium',
        completed: false,
        subTasks: [
          { id: 'sub-3', title: 'Testes do authStore', completed: false },
          { id: 'sub-4', title: 'Testes do tasksStore', completed: false },
        ],
        createdAt: Date.now() - 43200000,
      },
      {
        id: generateId(),
        userId,
        title: 'Organizar arquivos de assets',
        description: 'Mover imagens para pastas corretas',
        priority: 'low',
        completed: true,
        subTasks: [],
        createdAt: Date.now() - 172800000,
        completedAt: Date.now() - 86400000,
      },
    ];
  }
};

export const MockTaskRepository: TaskRepository = {
  async getAll(userId: string): Promise<Task[]> {
    seedDemoTasks(userId);
    return mockTasks.filter((task) => task.userId === userId);
  },

  async getById(id: string): Promise<Task | null> {
    return mockTasks.find((task) => task.id === id) || null;
  },

  async create(input: CreateTaskInput): Promise<Task> {
    const newTask: Task = {
      ...input,
      id: generateId(),
      createdAt: Date.now(),
    };
    mockTasks.push(newTask);
    notify();
    return newTask;
  },

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const index = mockTasks.findIndex((task) => task.id === id);
    if (index === -1) {
      throw new Error(`Task not found: ${id}`);
    }
    mockTasks[index] = { ...mockTasks[index], ...input };
    notify();
    return mockTasks[index];
  },

  async delete(id: string): Promise<void> {
    mockTasks = mockTasks.filter((task) => task.id !== id);
    notify();
  },

  async toggleTask(id: string): Promise<Task> {
    const index = mockTasks.findIndex((task) => task.id === id);
    if (index === -1) {
      throw new Error(`Task not found: ${id}`);
    }
    const task = mockTasks[index];
    const completed = !task.completed;
    mockTasks[index] = {
      ...task,
      completed,
      completedAt: completed ? Date.now() : undefined,
    };
    notify();
    return mockTasks[index];
  },

  async addSubTask(taskId: string, title: string): Promise<Task> {
    const index = mockTasks.findIndex((task) => task.id === taskId);
    if (index === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }
    const newSubTask: SubTask = {
      id: `sub-${Date.now()}-${idCounter++}`,
      title,
      completed: false,
    };
    mockTasks[index] = {
      ...mockTasks[index],
      subTasks: [...mockTasks[index].subTasks, newSubTask],
    };
    notify();
    return mockTasks[index];
  },

  async toggleSubTask(taskId: string, subTaskId: string): Promise<Task> {
    const index = mockTasks.findIndex((task) => task.id === taskId);
    if (index === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }
    mockTasks[index] = {
      ...mockTasks[index],
      subTasks: mockTasks[index].subTasks.map((st) =>
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
      ),
    };
    notify();
    return mockTasks[index];
  },

  async deleteSubTask(taskId: string, subTaskId: string): Promise<Task> {
    const index = mockTasks.findIndex((task) => task.id === taskId);
    if (index === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }
    mockTasks[index] = {
      ...mockTasks[index],
      subTasks: mockTasks[index].subTasks.filter((st) => st.id !== subTaskId),
    };
    notify();
    return mockTasks[index];
  },

  subscribe(userId: string, callback: (tasks: Task[]) => void): () => void {
    seedDemoTasks(userId);
    const wrappedCb = (tasks: Task[]) => {
      callback(tasks.filter((task) => task.userId === userId));
    };
    listeners.push(wrappedCb);
    // Initial call
    wrappedCb(mockTasks);
    return () => {
      listeners = listeners.filter((cb) => cb !== wrappedCb);
    };
  },
};

// Reset function for testing
export const resetMockTaskRepository = () => {
  mockTasks = [];
  listeners = [];
  idCounter = 1;
};
