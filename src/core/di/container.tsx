import type { AuthRepository } from "@app/domain/repositories/AuthRepository";
import type { FileRepository } from "@app/domain/repositories/FileRepository";
import type { TaskRepository } from "@app/domain/repositories/TaskRepository";
import type { ChatRepository } from "@app/domain/repositories/ChatRepository";
import type { UserRepository } from "@app/domain/repositories/UserRepository";
import type { NotificationRepository } from "@app/domain/repositories/NotificationRepository";
import { Logger } from "@infrastructure/logging/Logger";

export type Token<T> = symbol & { __type?: T };

export class Container {
  private registry = new Map<symbol | string, unknown>();

  constructor() {
    // Register default instances for backward compatibility or core services
    this.registry.set("Logger", new Logger());
  }

  set<T>(token: Token<T> | string, value: T) {
    this.registry.set(token, value as unknown);
  }

  get<T>(token: Token<T> | string): T {
    if (!this.registry.has(token)) {
      console.warn(`DI: token not registered: ${String(token)}`);
      // throw new Error(`DI: token not registered: ${String(token)}`);
    }
    return this.registry.get(token) as T;
  }

  // Backward compatibility with the .ts version
  resolve<T>(token: Token<T> | string): T {
    return this.get(token);
  }

  has<T>(token: Token<T> | string): boolean {
    return this.registry.has(token);
  }

  register<T>(token: Token<T> | string, instance: T): void {
    this.set(token, instance);
  }
}

// Simple DI facade used by viewmodels
export type DI = { resolve<T>(token: Token<T> | string): T };

export const TOKENS = {
  AuthRepository: Symbol("AuthRepository") as Token<AuthRepository>,
  FileRepository: Symbol("FileRepository") as Token<FileRepository>,
  TaskRepository: Symbol("TaskRepository") as Token<TaskRepository>,
  ChatRepository: Symbol("ChatRepository") as Token<ChatRepository>,
  UserRepository: Symbol("UserRepository") as Token<UserRepository>,
  NotificationRepository: Symbol("NotificationRepository") as Token<NotificationRepository>,
  Logger: "Logger",
  GoogleAuthService: "GoogleAuthService",
  FirebaseInitializer: "FirebaseInitializer",
} as const;

export function createDI(container: Container): DI {
  return {
    resolve<T>(token: Token<T> | string): T {
      return container.get(token);
    },
  };
}

// Global instance for backward compatibility
export const di = new Container();
