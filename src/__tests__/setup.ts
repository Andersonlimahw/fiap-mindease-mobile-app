/**
 * Test Setup File
 * Configures mocks and global setup for Vitest
 */

import { vi, beforeEach, afterEach } from 'vitest';

// Mock zustand persist middleware to use in-memory storage
vi.mock('zustand/middleware', () => {
  return {
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

// Mock @react-native-firebase/messaging (native module — não parseável em jsdom)
vi.mock('@react-native-firebase/messaging', () => {
  const messagingMock = {
    requestPermission: vi.fn().mockResolvedValue(1), // AUTHORIZED
    getToken: vi.fn().mockResolvedValue('mock-fcm-token'),
    onMessage: vi.fn().mockReturnValue(() => {}),
    onNotificationOpenedApp: vi.fn().mockReturnValue(() => {}),
    getInitialNotification: vi.fn().mockResolvedValue(null),
    AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2, DENIED: 0, NOT_DETERMINED: -1 },
  };
  const fn = vi.fn(() => messagingMock) as any;
  fn.AuthorizationStatus = messagingMock.AuthorizationStatus;
  return { default: fn };
});

// Mock NotificationService para testes que não testam FCM diretamente
vi.mock('@app/infrastructure/notifications/NotificationService', () => ({
  NotificationService: {
    init: vi.fn().mockResolvedValue('mock-fcm-token'),
    getFcmToken: vi.fn().mockResolvedValue('mock-fcm-token'),
    requestPermission: vi.fn().mockResolvedValue(true),
    setOnMessageHandler: vi.fn(),
    cleanup: vi.fn(),
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
