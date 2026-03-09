export interface UserRepository {
  saveSettings(userId: string, settings: any): Promise<void>;
  getSettings(userId: string): Promise<any | null>;
  subscribeSettings(userId: string, callback: (settings: any) => void): () => void;
}
