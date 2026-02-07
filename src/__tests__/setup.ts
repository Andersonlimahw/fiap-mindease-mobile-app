/**
 * Test Setup File
 * Configures mocks and global setup for Vitest
 */

import { vi, beforeEach, afterEach } from 'vitest';

// Mock zustand persist middleware to use in-memory storage
vi.mock('zustand/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('zustand/middleware')>();
  return {
    ...actual,
    persist: (config: any) => config,
    createJSONStorage: () => ({
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }),
  };
});

// Mock secure storage
vi.mock('@app/infrastructure/storage/SecureStorage', () => ({
  zustandSecureStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

// Mock DI store for tests that need it
vi.mock('@store/diStore', () => ({
  useDIStore: {
    getState: vi.fn(() => ({
      di: {
        resolve: vi.fn(),
      },
    })),
  },
}));

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
