import type { UserRepository } from '@app/domain/repositories/UserRepository';

export class MockUserRepository implements UserRepository {
  private settings: any = {};

  async saveSettings(userId: string, settings: any): Promise<void> {
    this.settings[userId] = { ...(this.settings[userId] || {}), ...settings };
  }

  async getSettings(userId: string): Promise<any | null> {
    return this.settings[userId] || null;
  }

  subscribeSettings(userId: string, callback: (settings: any) => void): () => void {
    const interval = setInterval(() => {
      if (this.settings[userId]) {
        callback(this.settings[userId]);
      }
    }, 5000);
    return () => clearInterval(interval);
  }
}
