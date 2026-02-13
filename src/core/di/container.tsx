import type { AuthRepository } from "@app/domain/repositories/AuthRepository";
import type { FileRepository } from "@app/domain/repositories/FileRepository";
import type { TaskRepository } from "@app/domain/repositories/TaskRepository";
import type { ChatRepository } from "@app/domain/repositories/ChatRepository";

export type Token<T> = symbol & { __type?: T };

export class Container {
  private registry = new Map<symbol, unknown>();

  set<T>(token: Token<T>, value: T) {
    this.registry.set(token, value as unknown);
  }

  get<T>(token: Token<T>): T {
    if (!this.registry.has(token)) {
      console.warn(`DI: token not registered: ${String(token)}`);
      // throw new Error(`DI: token not registered: ${String(token)}`);
    }
    return this.registry.get(token) as T;
  }
}

// Simple DI facade used by viewmodels
export type DI = { resolve<T>(token: Token<T>): T };

export const TOKENS = {
  AuthRepository: Symbol("AuthRepository") as Token<AuthRepository>,
  FileRepository: Symbol("FileRepository") as Token<FileRepository>,
  TaskRepository: Symbol("TaskRepository") as Token<TaskRepository>,
  ChatRepository: Symbol("ChatRepository") as Token<ChatRepository>,
};

export function createDI(container: Container): DI {
  return {
    resolve<T>(token: Token<T>): T {
      return container.get(token);
    },
  };
}
