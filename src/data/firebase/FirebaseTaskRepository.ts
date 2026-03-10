import type { TaskRepository } from '../domain/repositories/TaskRepository';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  SubTask,
} from '../domain/entities/Task';
import { FirebaseAPI } from '../infrastructure/firebase/firebase';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from '@react-native-firebase/firestore';

/**
 * Firebase implementation of TaskRepository.
 * Collection path: users/{userId}/tasks/{taskId}
 * Matches mobile and web structure for cross-platform sync.
 */
export class FirebaseTaskRepository implements TaskRepository {
  private getDb() {
    return FirebaseAPI.db ?? getFirestore();
  }

  /** Returns the tasks subcollection for a given user. */
  private getUserTasksCollection(userId: string) {
    const db = this.getDb();
    return collection(db, 'users', userId, 'tasks');
  }

  /**
   * Returns the doc ref for a specific task.
   * Falls back to FirebaseAPI.getCurrentUserId() when userId is not passed
   * (used by methods that don't receive userId from the interface).
   */
  private getTaskDocRef(taskId: string, userId?: string) {
    const uid = userId ?? FirebaseAPI.getCurrentUserId();
    if (!uid) throw new Error('No authenticated user');
    const db = this.getDb();
    return doc(db, 'users', uid, 'tasks', taskId);
  }

  private parseTask(id: string, data: any): Task {
    const toMillis = (value: any): number | undefined => {
      if (!value) return undefined;
      if (typeof value.toMillis === 'function') return value.toMillis();
      const num = Number(value);
      if (!isNaN(num)) return num;
      // ISO string fallback (tasks created by web app)
      const fromDate = new Date(value).getTime();
      return isNaN(fromDate) ? undefined : fromDate;
    };

    const createdAt = toMillis(data.createdAt) ?? Date.now();
    const completedAt = toMillis(data.completedAt);

    return {
      id,
      userId: data.userId || FirebaseAPI.getCurrentUserId() || '',
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
    const q = query(
      this.getUserTasksCollection(userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap?.docs.map((d: any) => this.parseTask(d.id, d.data())) || [];
  }

  async getById(id: string): Promise<Task | null> {
    const docRef = this.getTaskDocRef(id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return this.parseTask(snap.id, snap.data());
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const docData = {
      userId: input.userId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      completed: input.completed,
      subTasks: input.subTasks || [],
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      this.getUserTasksCollection(input.userId),
      docData
    );

    return {
      ...input,
      id: docRef.id,
      createdAt: Date.now(),
    };
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const docRef = this.getTaskDocRef(id);

    const updates: any = { ...input };
    if (input.completed !== undefined && input.completed) {
      updates.completedAt = serverTimestamp();
    }

    await updateDoc(docRef, updates);

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Task not found: ${id}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(this.getTaskDocRef(id));
  }

  async toggleTask(id: string): Promise<Task> {
    const task = await this.getById(id);
    if (!task) throw new Error(`Task not found: ${id}`);

    const completed = !task.completed;
    return this.update(id, {
      completed,
      completedAt: completed ? Date.now() : undefined,
    });
  }

  async addSubTask(taskId: string, title: string): Promise<Task> {
    const task = await this.getById(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    const newSubTask: SubTask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title,
      completed: false,
    };

    return this.update(taskId, {
      subTasks: [...task.subTasks, newSubTask],
    });
  }

  async toggleSubTask(taskId: string, subTaskId: string): Promise<Task> {
    const task = await this.getById(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    return this.update(taskId, {
      subTasks: task.subTasks.map((st) =>
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
      ),
    });
  }

  async deleteSubTask(taskId: string, subTaskId: string): Promise<Task> {
    const task = await this.getById(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    return this.update(taskId, {
      subTasks: task.subTasks.filter((st) => st.id !== subTaskId),
    });
  }

  subscribe(userId: string, callback: (tasks: Task[]) => void): () => void {
    const q = query(
      this.getUserTasksCollection(userId),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap: any) => {
        const tasks =
          snap?.docs.map((d: any) => this.parseTask(d.id, d.data())) || [];
        callback(tasks);
      },
      (error: any) => {
        console.error('[FirebaseTaskRepository] subscribe error:', error);
      }
    );

    return unsub;
  }
}
