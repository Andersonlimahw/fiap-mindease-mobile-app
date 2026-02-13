import type { TaskRepository } from '@app/domain/repositories/TaskRepository';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  SubTask,
} from '@app/domain/entities/Task';
import { FirebaseAPI } from '@app/infrastructure/firebase/firebase';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from '@react-native-firebase/firestore';

const COLLECTION_NAME = 'tasks';

/**
 * Firebase implementation of TaskRepository
 * Provides real-time sync and CRUD operations for tasks
 */
export class FirebaseTaskRepository implements TaskRepository {
  private getDb() {
    return FirebaseAPI.db ?? getFirestore();
  }

  private parseTask(id: string, data: any): Task {
    const createdAt = data.createdAt?.toMillis
      ? data.createdAt.toMillis()
      : Number(data.createdAt) || Date.now();
    const completedAt = data.completedAt?.toMillis
      ? data.completedAt.toMillis()
      : data.completedAt
      ? Number(data.completedAt)
      : undefined;

    return {
      id,
      userId: data.userId,
      title: data.title,
      description: data.description || '',
      priority: data.priority || 'medium',
      completed: data.completed ?? false,
      subTasks: data.subTasks || [],
      createdAt,
      completedAt,
    };
  }

  async getAll(userId: string): Promise<Task[]> {
    const db = this.getDb();
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);
    return snap?.docs.map((d: any) => this.parseTask(d.id, d.data())) || [];
  }

  async getById(id: string): Promise<Task | null> {
    const db = this.getDb();
    const docRef = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return null;
    }

    return this.parseTask(snap.id, snap.data());
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const db = this.getDb();
    const docData = {
      userId: input.userId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      completed: input.completed,
      subTasks: input.subTasks || [],
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);

    return {
      ...input,
      id: docRef.id,
      createdAt: Date.now(),
    };
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const db = this.getDb();
    const docRef = doc(db, COLLECTION_NAME, id);

    const updates: any = { ...input };
    if (input.completed !== undefined && input.completed) {
      updates.completedAt = serverTimestamp();
    }

    await updateDoc(docRef, updates);

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Task not found: ${id}`);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = this.getDb();
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }

  async toggleTask(id: string): Promise<Task> {
    const task = await this.getById(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    const completed = !task.completed;
    return this.update(id, {
      completed,
      completedAt: completed ? Date.now() : undefined,
    });
  }

  async addSubTask(taskId: string, title: string): Promise<Task> {
    const task = await this.getById(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const newSubTask: SubTask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title,
      completed: false,
    };

    const updatedSubTasks = [...task.subTasks, newSubTask];
    return this.update(taskId, { subTasks: updatedSubTasks });
  }

  async toggleSubTask(taskId: string, subTaskId: string): Promise<Task> {
    const task = await this.getById(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const updatedSubTasks = task.subTasks.map((st) =>
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );

    return this.update(taskId, { subTasks: updatedSubTasks });
  }

  async deleteSubTask(taskId: string, subTaskId: string): Promise<Task> {
    const task = await this.getById(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const updatedSubTasks = task.subTasks.filter((st) => st.id !== subTaskId);
    return this.update(taskId, { subTasks: updatedSubTasks });
  }

  subscribe(userId: string, callback: (tasks: Task[]) => void): () => void {
    const db = this.getDb();
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap: any) => {
      const tasks =
        snap?.docs.map((d: any) => this.parseTask(d.id, d.data())) || [];
      callback(tasks);
    });

    return unsub;
  }
}
