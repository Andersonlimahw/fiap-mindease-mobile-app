
import { Logger } from '@app/infrastructure/logging/Logger';

export const TOKENS = {
  Logger: 'Logger',
  GoogleAuthService: 'GoogleAuthService',
  FirebaseInitializer: 'FirebaseInitializer',
} as const;

class DIContainer {
  private instances = new Map<string, any>();

  constructor() {
    this.register(TOKENS.Logger, new Logger());
  }

  register<T>(token: string, instance: T): void {
    this.instances.set(token, instance);
  }

  resolve<T>(token: string): T {
    const instance = this.instances.get(token);
    if (!instance) {
      throw new Error(`No instance registered for token: ${token}`);
    }
    return instance;
  }

  has(token: string): boolean {
    return this.instances.has(token);
  }
}

export const di = new DIContainer();
