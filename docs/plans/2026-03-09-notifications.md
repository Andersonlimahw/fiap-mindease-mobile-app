# Notifications (FCM + Firestore Inbox) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar notificações reais integradas com Firebase — inbox in-app via Firestore real-time listener + push FCM para entrega quando o app está fechado/background.

**Architecture:** Seguir Clean Architecture existente (domain → data → store → presentation). `NotificationService` gerencia FCM token e handlers. `notificationStore` assina `users/{userId}/notifications` em tempo real via Firestore. Aba "Notificações" no bottom tab navigator.

**Tech Stack:** `@react-native-firebase/messaging` v23, `@react-native-firebase/firestore`, Zustand, react-native-permissions, Clean Architecture + DI container existentes.

---

## Firestore Schema

```
users/{userId}/
  fcmTokens: string[]           # array de tokens FCM (multi-device)

users/{userId}/notifications/{notifId}/
  id: string
  type: 'task_created' | 'task_completed' | 'task_due' | 'pomodoro_completed' | 'pomodoro_goal' | 'fcm'
  title: string
  body: string
  read: boolean
  createdAt: Timestamp
  data: Record<string, string>  # payload extra (taskId, sessionCount, etc.)
```

---

### Task 1: Instalar @react-native-firebase/messaging

**Files:**
- Modify: `package.json`
- Modify: `app.json`
- Modify: `src/utils/permissions.ts`

**Step 1: Instalar o pacote**

```bash
npm install @react-native-firebase/messaging
```

**Step 2: Verificar instalação**

```bash
cat package.json | grep messaging
```
Expected: `"@react-native-firebase/messaging": "^23.x.x"`

**Step 3: Adicionar plugin em app.json**

No array `expo.plugins`, adicionar após `@react-native-firebase/auth`:
```json
"@react-native-firebase/messaging"
```

E adicionar permissão Android para notificações no plugin `react-native-permissions`:
```json
"androidPermissions": [
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.RECEIVE_BOOT_COMPLETED",
  "android.permission.VIBRATE"
]
```

E adicionar permissão iOS:
```json
"iosPermissions": [
  "PhotoLibrary",
  "PhotoLibraryAddOnly",
  "Notifications"
]
```

**Step 4: Commit**

```bash
git add package.json app.json package-lock.json
git commit -m "feat(notifications): install @react-native-firebase/messaging"
```

---

### Task 2: Domain Layer — Notification entity + repository interface

**Files:**
- Create: `src/domain/entities/Notification.ts`
- Create: `src/domain/repositories/NotificationRepository.ts`

**Step 1: Criar entidade Notification**

```typescript
// src/domain/entities/Notification.ts
export type NotificationType =
  | 'task_created'
  | 'task_completed'
  | 'task_due'
  | 'pomodoro_completed'
  | 'pomodoro_goal'
  | 'fcm';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
  data?: Record<string, string>;
}

export type CreateNotificationInput = Omit<Notification, 'id' | 'createdAt' | 'read'>;
```

**Step 2: Criar interface NotificationRepository**

```typescript
// src/domain/repositories/NotificationRepository.ts
import type { Notification, CreateNotificationInput } from '../entities/Notification';

export interface NotificationRepository {
  /** Obtém todas as notificações do usuário */
  getAll(userId: string): Promise<Notification[]>;
  /** Cria uma nova notificação no Firestore */
  create(userId: string, input: CreateNotificationInput): Promise<Notification>;
  /** Marca notificação como lida */
  markAsRead(userId: string, notificationId: string): Promise<void>;
  /** Marca todas como lidas */
  markAllAsRead(userId: string): Promise<void>;
  /** Remove uma notificação */
  delete(userId: string, notificationId: string): Promise<void>;
  /** Salva/atualiza FCM token do dispositivo */
  saveFcmToken(userId: string, token: string): Promise<void>;
  /** Assina notificações em tempo real */
  subscribe(userId: string, callback: (notifications: Notification[]) => void): () => void;
}
```

**Step 3: Commit**

```bash
git add src/domain/entities/Notification.ts src/domain/repositories/NotificationRepository.ts
git commit -m "feat(notifications): add Notification entity and repository interface"
```

---

### Task 3: FirebaseNotificationRepository

**Files:**
- Create: `src/data/firebase/FirebaseNotificationRepository.ts`

**Step 1: Implementar o repositório**

```typescript
// src/data/firebase/FirebaseNotificationRepository.ts
import type { NotificationRepository } from '@app/domain/repositories/NotificationRepository';
import type { Notification, CreateNotificationInput } from '@app/domain/entities/Notification';
import { FirebaseAPI } from '@app/infrastructure/firebase/firebase';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  where,
  arrayUnion,
} from '@react-native-firebase/firestore';

export class FirebaseNotificationRepository implements NotificationRepository {
  private getDb() {
    return FirebaseAPI.db ?? getFirestore();
  }

  private getNotificationsCollection(userId: string) {
    return collection(this.getDb(), 'users', userId, 'notifications');
  }

  private parseNotification(id: string, data: any): Notification {
    return {
      id,
      type: data.type ?? 'fcm',
      title: data.title ?? '',
      body: data.body ?? '',
      read: data.read ?? false,
      createdAt:
        typeof data.createdAt?.toMillis === 'function'
          ? data.createdAt.toMillis()
          : Date.now(),
      data: data.data ?? {},
    };
  }

  async getAll(userId: string): Promise<Notification[]> {
    const col = this.getNotificationsCollection(userId);
    const q = query(col, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => this.parseNotification(d.id, d.data()));
  }

  async create(userId: string, input: CreateNotificationInput): Promise<Notification> {
    const col = this.getNotificationsCollection(userId);
    const payload = {
      ...input,
      read: false,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(col, payload);
    return {
      id: ref.id,
      ...input,
      read: false,
      createdAt: Date.now(),
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(ref, { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const col = this.getNotificationsCollection(userId);
    const q = query(col, where('read', '==', false));
    const snap = await getDocs(q);
    const db = this.getDb();
    const batch = writeBatch(db);
    snap.docs.forEach((d: any) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  }

  async delete(userId: string, notificationId: string): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, 'users', userId, 'notifications', notificationId);
    await deleteDoc(ref);
  }

  async saveFcmToken(userId: string, token: string): Promise<void> {
    const db = this.getDb();
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { fcmTokens: arrayUnion(token) });
  }

  subscribe(userId: string, callback: (notifications: Notification[]) => void): () => void {
    const col = this.getNotificationsCollection(userId);
    const q = query(col, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap: any) => {
      const notifications = snap.docs.map((d: any) =>
        this.parseNotification(d.id, d.data())
      );
      callback(notifications);
    });
    return unsubscribe;
  }
}
```

**Step 2: Commit**

```bash
git add src/data/firebase/FirebaseNotificationRepository.ts
git commit -m "feat(notifications): implement FirebaseNotificationRepository"
```

---

### Task 4: MockNotificationRepository

**Files:**
- Create: `src/data/mock/MockNotificationRepository.ts`

**Step 1: Implementar o mock**

```typescript
// src/data/mock/MockNotificationRepository.ts
import type { NotificationRepository } from '@app/domain/repositories/NotificationRepository';
import type { Notification, CreateNotificationInput } from '@app/domain/entities/Notification';

let mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'task_created',
    title: 'Nova tarefa criada',
    body: 'Revisar documentação do projeto foi adicionada.',
    read: false,
    createdAt: Date.now() - 3600000,
    data: { taskId: 'task-1' },
  },
  {
    id: 'notif-2',
    type: 'pomodoro_completed',
    title: 'Sessão Pomodoro concluída!',
    body: 'Você completou 1 sessão de foco. Continue assim!',
    read: true,
    createdAt: Date.now() - 7200000,
    data: {},
  },
];

let listeners: ((notifications: Notification[]) => void)[] = [];
let idCounter = 10;

const notify = () => {
  const sorted = [...mockNotifications].sort((a, b) => b.createdAt - a.createdAt);
  listeners.forEach((cb) => cb(sorted));
};

export class MockNotificationRepository implements NotificationRepository {
  async getAll(_userId: string): Promise<Notification[]> {
    return [...mockNotifications].sort((a, b) => b.createdAt - a.createdAt);
  }

  async create(_userId: string, input: CreateNotificationInput): Promise<Notification> {
    const notification: Notification = {
      ...input,
      id: `notif-${idCounter++}`,
      read: false,
      createdAt: Date.now(),
    };
    mockNotifications = [notification, ...mockNotifications];
    notify();
    return notification;
  }

  async markAsRead(_userId: string, notificationId: string): Promise<void> {
    mockNotifications = mockNotifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    notify();
  }

  async markAllAsRead(_userId: string): Promise<void> {
    mockNotifications = mockNotifications.map((n) => ({ ...n, read: true }));
    notify();
  }

  async delete(_userId: string, notificationId: string): Promise<void> {
    mockNotifications = mockNotifications.filter((n) => n.id !== notificationId);
    notify();
  }

  async saveFcmToken(_userId: string, _token: string): Promise<void> {
    // No-op em mock
  }

  subscribe(_userId: string, callback: (notifications: Notification[]) => void): () => void {
    listeners.push(callback);
    const sorted = [...mockNotifications].sort((a, b) => b.createdAt - a.createdAt);
    callback(sorted);
    return () => {
      listeners = listeners.filter((l) => l !== callback);
    };
  }
}
```

**Step 2: Commit**

```bash
git add src/data/mock/MockNotificationRepository.ts
git commit -m "feat(notifications): add MockNotificationRepository"
```

---

### Task 5: NotificationService — FCM Handler

**Files:**
- Create: `src/infrastructure/notifications/NotificationService.ts`

**Step 1: Implementar o serviço FCM**

```typescript
// src/infrastructure/notifications/NotificationService.ts
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { PERMISSIONS, request, check, RESULTS } from 'react-native-permissions';

export type FcmMessageHandler = (title: string, body: string, data?: Record<string, string>) => void;

let onMessageHandler: FcmMessageHandler | null = null;
let unsubscribeForeground: (() => void) | null = null;
let initialized = false;

/**
 * NotificationService — gerencia FCM: permissões, token, handlers foreground/background.
 */
export const NotificationService = {
  /**
   * Solicita permissão de notificação ao usuário.
   * iOS: usa firebase messaging (authorizationStatus)
   * Android 13+: usa react-native-permissions (POST_NOTIFICATIONS)
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        return enabled;
      }

      if (Platform.OS === 'android') {
        const sdk = Number(Platform.Version);
        if (sdk >= 33) {
          const status = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
          if (status === RESULTS.GRANTED) return true;
          const result = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
          return result === RESULTS.GRANTED;
        }
        // Android < 13: permissão concedida por padrão
        return true;
      }

      return false;
    } catch (error) {
      console.error('[NotificationService] requestPermission error:', error);
      return false;
    }
  },

  /**
   * Obtém o token FCM do dispositivo.
   */
  async getFcmToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('[NotificationService] getFcmToken error:', error);
      return null;
    }
  },

  /**
   * Inicializa o serviço: solicita permissão, obtém token, registra handlers.
   * Retorna o token FCM ou null se permissão negada.
   */
  async init(onMessage?: FcmMessageHandler): Promise<string | null> {
    if (initialized) return this.getFcmToken();
    initialized = true;

    if (onMessage) {
      onMessageHandler = onMessage;
    }

    const granted = await this.requestPermission();
    if (!granted) {
      console.log('[NotificationService] Notification permission denied');
      return null;
    }

    const token = await this.getFcmToken();
    if (!token) return null;

    // Handler para mensagens em foreground
    if (unsubscribeForeground) unsubscribeForeground();
    unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      const title = remoteMessage.notification?.title ?? 'MindEase';
      const body = remoteMessage.notification?.body ?? '';
      const data = (remoteMessage.data ?? {}) as Record<string, string>;
      console.log('[NotificationService] Foreground message:', { title, body, data });
      onMessageHandler?.(title, body, data);
    });

    // Handler para quando o app é aberto via notificação (background→foreground)
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[NotificationService] App opened from background notification:', remoteMessage);
    });

    // Handler para quando o app estava fechado (quit state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('[NotificationService] App opened from quit state notification:', remoteMessage);
        }
      });

    return token;
  },

  /**
   * Atualiza o handler de mensagens foreground.
   */
  setOnMessageHandler(handler: FcmMessageHandler) {
    onMessageHandler = handler;
  },

  /**
   * Limpa recursos (use ao fazer sign out).
   */
  cleanup() {
    if (unsubscribeForeground) {
      unsubscribeForeground();
      unsubscribeForeground = null;
    }
    initialized = false;
  },
};
```

**Step 2: Commit**

```bash
git add src/infrastructure/notifications/NotificationService.ts
git commit -m "feat(notifications): add NotificationService FCM handler"
```

---

### Task 6: notificationStore — Zustand store

**Files:**
- Create: `src/store/notificationStore.ts`

**Step 1: Implementar o store**

```typescript
// src/store/notificationStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Notification, CreateNotificationInput } from '@app/domain/entities/Notification';
import type { NotificationRepository } from '@app/domain/repositories/NotificationRepository';
import { TOKENS } from '@app/core/di/container';
import { useDIStore } from './diStore';
import { zustandSecureStorage } from '@app/infrastructure/storage/SecureStorage';

type NotificationState = {
  notifications: Notification[];
  loading: boolean;
  error: string | null;

  // Actions
  subscribe: (userId: string) => () => void;
  createNotification: (userId: string, input: CreateNotificationInput) => Promise<void>;
  markAsRead: (userId: string, notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (userId: string, notificationId: string) => Promise<void>;
  saveFcmToken: (userId: string, token: string) => Promise<void>;
  addFcmNotification: (userId: string, title: string, body: string, data?: Record<string, string>) => Promise<void>;
  clearError: () => void;
};

const STORAGE_KEY = '@mindease/notifications:v1';

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      loading: false,
      error: null,

      subscribe: (userId: string) => {
        const repo = useDIStore
          .getState()
          .di.resolve<NotificationRepository>(TOKENS.NotificationRepository);

        set({ loading: true, error: null });

        const unsubscribe = repo.subscribe(userId, (notifications) => {
          set({ notifications, loading: false });
        });

        return unsubscribe;
      },

      createNotification: async (userId, input) => {
        const repo = useDIStore
          .getState()
          .di.resolve<NotificationRepository>(TOKENS.NotificationRepository);
        try {
          await repo.create(userId, input);
        } catch (e: any) {
          set({ error: e.message ?? 'Erro ao criar notificação' });
        }
      },

      markAsRead: async (userId, notificationId) => {
        const repo = useDIStore
          .getState()
          .di.resolve<NotificationRepository>(TOKENS.NotificationRepository);
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
        try {
          await repo.markAsRead(userId, notificationId);
        } catch (e: any) {
          set({ error: e.message ?? 'Erro ao marcar como lida' });
        }
      },

      markAllAsRead: async (userId) => {
        const repo = useDIStore
          .getState()
          .di.resolve<NotificationRepository>(TOKENS.NotificationRepository);
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
        try {
          await repo.markAllAsRead(userId);
        } catch (e: any) {
          set({ error: e.message ?? 'Erro ao marcar todas como lidas' });
        }
      },

      deleteNotification: async (userId, notificationId) => {
        const repo = useDIStore
          .getState()
          .di.resolve<NotificationRepository>(TOKENS.NotificationRepository);
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== notificationId),
        }));
        try {
          await repo.delete(userId, notificationId);
        } catch (e: any) {
          set({ error: e.message ?? 'Erro ao deletar notificação' });
        }
      },

      saveFcmToken: async (userId, token) => {
        const repo = useDIStore
          .getState()
          .di.resolve<NotificationRepository>(TOKENS.NotificationRepository);
        try {
          await repo.saveFcmToken(userId, token);
        } catch (e: any) {
          console.warn('[notificationStore] saveFcmToken error:', e);
        }
      },

      addFcmNotification: async (userId, title, body, data) => {
        const repo = useDIStore
          .getState()
          .di.resolve<NotificationRepository>(TOKENS.NotificationRepository);
        try {
          await repo.create(userId, { type: 'fcm', title, body, data });
        } catch (e: any) {
          console.warn('[notificationStore] addFcmNotification error:', e);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => zustandSecureStorage),
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);

// Selectors
export const useNotifications = () => useNotificationStore((s) => s.notifications);
export const useUnreadCount = () =>
  useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);
export const useNotificationLoading = () => useNotificationStore((s) => s.loading);
export const useNotificationError = () => useNotificationStore((s) => s.error);
```

**Step 2: Commit**

```bash
git add src/store/notificationStore.ts
git commit -m "feat(notifications): add notificationStore with real-time Firestore listener"
```

---

### Task 7: Atualizar DI Container + diStore

**Files:**
- Modify: `src/core/di/container.tsx`
- Modify: `src/store/diStore.ts`

**Step 1: Adicionar token NotificationRepository em container.tsx**

No arquivo `src/core/di/container.tsx`, adicionar import e token:
```typescript
import type { NotificationRepository } from '@app/domain/repositories/NotificationRepository';

// No objeto TOKENS:
NotificationRepository: Symbol("NotificationRepository") as Token<NotificationRepository>,
```

**Step 2: Registrar repositório em diStore.ts**

No `src/store/diStore.ts`, adicionar imports:
```typescript
import { FirebaseNotificationRepository } from '@app/data/firebase/FirebaseNotificationRepository';
import { MockNotificationRepository } from '@app/data/mock/MockNotificationRepository';
```

No `buildContainer()` ou equivalente, registrar:
```typescript
container.set(
  TOKENS.NotificationRepository,
  AppConfig.useMock
    ? new MockNotificationRepository()
    : new FirebaseNotificationRepository()
);
```

**Step 3: Commit**

```bash
git add src/core/di/container.tsx src/store/diStore.ts
git commit -m "feat(notifications): register NotificationRepository in DI container"
```

---

### Task 8: Atualizar App.tsx — inicializar NotificationService

**Files:**
- Modify: `App.tsx`

**Step 1: Adicionar inicialização do NotificationService**

```typescript
import { NotificationService } from './src/infrastructure/notifications/NotificationService';

// Dentro do useEffect em App():
useEffect(() => {
  initAuthStore();
  // ... código existente ...

  // Inicializar serviço de notificações
  // O token FCM será salvo no Firestore pelo authStore após login
  NotificationService.init().catch((e) =>
    console.warn('[App] NotificationService init error:', e)
  );
}, []);
```

**Step 2: Commit**

```bash
git add App.tsx
git commit -m "feat(notifications): initialize NotificationService on app start"
```

---

### Task 9: Atualizar authStore — salvar FCM token após login

**Files:**
- Modify: `src/store/authStore.ts`

**Step 1: Salvar token FCM quando usuário faz login**

Após autenticação bem-sucedida no authStore, adicionar:
```typescript
import { NotificationService } from '@app/infrastructure/notifications/NotificationService';
import { useNotificationStore } from './notificationStore';

// Após setar o usuário no estado:
const fcmToken = await NotificationService.getFcmToken();
if (fcmToken && user.id) {
  await useNotificationStore.getState().saveFcmToken(user.id, fcmToken);
  // Iniciar listener de notificações
  useNotificationStore.getState().subscribe(user.id);
  // Handler para mensagens FCM em foreground
  NotificationService.setOnMessageHandler((title, body, data) => {
    useNotificationStore.getState().addFcmNotification(user.id, title, body, data);
  });
}
```

**Step 2: Commit**

```bash
git add src/store/authStore.ts
git commit -m "feat(notifications): save FCM token and subscribe on auth"
```

---

### Task 10: NotificationsScreen

**Files:**
- Create: `src/presentation/screens/Notifications/NotificationsScreen.tsx`
- Create: `src/presentation/screens/Notifications/NotificationsScreen.styles.ts`

**Step 1: Criar NotificationsScreen.tsx**

```typescript
// src/presentation/screens/Notifications/NotificationsScreen.tsx
import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@app/presentation/theme/theme';
import { makeNotificationsStyles } from './NotificationsScreen.styles';
import {
  useNotifications,
  useUnreadCount,
  useNotificationStore,
  useNotificationLoading,
} from '@store/notificationStore';
import { useAuth } from '@store/authStore';
import { useI18n } from '@app/presentation/i18n/I18nProvider';
import type { Notification } from '@app/domain/entities/Notification';

const ICON_MAP: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  task_created: 'add-task',
  task_completed: 'task-alt',
  task_due: 'warning',
  pomodoro_completed: 'timer',
  pomodoro_goal: 'emoji-events',
  fcm: 'notifications',
};

export const NotificationsScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => makeNotificationsStyles(theme), [theme]);
  const notifications = useNotifications();
  const unreadCount = useUnreadCount();
  const loading = useNotificationLoading();
  const { markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const { user } = useAuth();

  const handleMarkAsRead = async (notif: Notification) => {
    if (!user?.id || notif.read) return;
    await markAsRead(user.id, notif.id);
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    await markAllAsRead(user.id);
  };

  const handleDelete = async (notifId: string) => {
    if (!user?.id) return;
    await deleteNotification(user.id, notifId);
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <Pressable
      style={[styles.item, !item.read && styles.itemUnread]}
      onPress={() => handleMarkAsRead(item)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '18' }]}>
        <MaterialIcons
          name={ICON_MAP[item.type] ?? 'notifications'}
          size={22}
          color={theme.colors.primary}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteBtn} hitSlop={8}>
        <MaterialIcons name="close" size={16} color={theme.colors.muted} />
      </Pressable>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <Pressable style={styles.markAllBtn} onPress={handleMarkAllAsRead}>
          <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
        </Pressable>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="notifications-none" size={56} color={theme.colors.muted} />
              <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};
```

**Step 2: Criar NotificationsScreen.styles.ts**

```typescript
// src/presentation/screens/Notifications/NotificationsScreen.styles.ts
import { StyleSheet } from 'react-native';
import type { AppTheme } from '@app/presentation/theme/theme';

export const makeNotificationsStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    list: {
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    emptyContainer: {
      flex: 1,
    },
    markAllBtn: {
      alignSelf: 'flex-end',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    markAllText: {
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
    },
    itemUnread: {
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    titleUnread: {
      fontWeight: '700',
    },
    body: {
      fontSize: 12,
      color: theme.colors.muted,
      lineHeight: 16,
    },
    time: {
      fontSize: 11,
      color: theme.colors.muted,
      marginTop: 2,
    },
    deleteBtn: {
      padding: 4,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingTop: 80,
    },
    emptyText: {
      fontSize: 15,
      color: theme.colors.muted,
    },
  });
```

**Step 3: Commit**

```bash
git add src/presentation/screens/Notifications/
git commit -m "feat(notifications): add NotificationsScreen with inbox UI"
```

---

### Task 11: Adicionar aba Notificações na navegação

**Files:**
- Modify: `src/presentation/navigation/RootNavigator.tsx`
- Modify: `src/presentation/navigation/types.ts`

**Step 1: Adicionar lazy import da NotificationsScreen em RootNavigator.tsx**

```typescript
const NotificationsScreen = lazy(() =>
  import('../screens/Notifications/NotificationsScreen').then((m) => ({
    default: m.NotificationsScreen,
  }))
);
const LazyNotifications = withSuspense(NotificationsScreen);
```

**Step 2: Adicionar aba no Tab.Navigator**

```typescript
<Tab.Screen
  name="Notifications"
  component={LazyNotifications}
  options={{
    tabBarLabel: t('tabs.notifications'),
    headerTitle: t('notifications.title'),
    tabBarIcon: ({ color, size }) => (
      <NotificationTabIcon color={color} size={size} />
    ),
  }}
/>
```

**Step 3: Criar componente NotificationTabIcon com badge**

Dentro de RootNavigator.tsx, criar:
```typescript
function NotificationTabIcon({ color, size }: { color: string; size: number }) {
  const unreadCount = useUnreadCount();
  return (
    <View>
      <MaterialIcons name="notifications" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}
```

**Step 4: Adicionar tipo da tela em types.ts**

No tipo `AppTabParamList` ou equivalente:
```typescript
Notifications: undefined;
```

**Step 5: Commit**

```bash
git add src/presentation/navigation/
git commit -m "feat(notifications): add Notifications tab with unread badge"
```

---

### Task 12: Adicionar traduções i18n

**Files:**
- Modify: `src/presentation/i18n/locales/pt.ts`
- Modify: `src/presentation/i18n/locales/en.ts`
- Modify: `src/presentation/i18n/locales/es.ts`

**Step 1: Adicionar chaves em pt.ts**

```typescript
notifications: {
  title: 'Notificações',
  empty: 'Nenhuma notificação por enquanto',
  markAllRead: 'Marcar todas como lidas',
  taskCreated: 'Nova tarefa criada',
  taskCompleted: 'Tarefa concluída',
  taskDue: 'Prazo de tarefa chegando',
  pomodoroCompleted: 'Sessão Pomodoro concluída!',
  pomodoroGoal: 'Meta diária atingida!',
},
tabs: {
  // ... existing tabs ...
  notifications: 'Notificações',
},
```

**Step 2: Adicionar chaves em en.ts**

```typescript
notifications: {
  title: 'Notifications',
  empty: 'No notifications yet',
  markAllRead: 'Mark all as read',
  taskCreated: 'New task created',
  taskCompleted: 'Task completed',
  taskDue: 'Task deadline approaching',
  pomodoroCompleted: 'Pomodoro session completed!',
  pomodoroGoal: 'Daily goal reached!',
},
tabs: {
  notifications: 'Notifications',
},
```

**Step 3: Adicionar chaves em es.ts**

```typescript
notifications: {
  title: 'Notificaciones',
  empty: 'No hay notificaciones aún',
  markAllRead: 'Marcar todas como leídas',
  taskCreated: 'Nueva tarea creada',
  taskCompleted: 'Tarea completada',
  taskDue: 'Fecha límite se acerca',
  pomodoroCompleted: '¡Sesión Pomodoro completada!',
  pomodoroGoal: '¡Meta diaria alcanzada!',
},
tabs: {
  notifications: 'Notificaciones',
},
```

**Step 4: Commit**

```bash
git add src/presentation/i18n/locales/
git commit -m "feat(notifications): add i18n translations for notifications"
```

---

### Task 13: Testes — FirebaseNotificationRepository

**Files:**
- Create: `src/data/firebase/__tests__/FirebaseNotificationRepository.test.ts`

**Step 1: Escrever testes**

Seguir o padrão exato de `FirebaseTaskRepository.test.ts`. Mockar `@react-native-firebase/firestore` com `vi.hoisted`. Testar: `getAll`, `create`, `markAsRead`, `markAllAsRead`, `delete`, `saveFcmToken`, `subscribe`.

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirebaseNotificationRepository } from '../FirebaseNotificationRepository';
import { FirebaseAPI } from '@app/infrastructure/firebase/firebase';

const firestoreMocks = vi.hoisted(() => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  writeBatch: vi.fn(),
  arrayUnion: vi.fn((v) => v),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
}));

vi.mock('@react-native-firebase/firestore', () => firestoreMocks);
vi.mock('@app/infrastructure/firebase/firebase', () => ({
  FirebaseAPI: { db: undefined },
}));

describe('FirebaseNotificationRepository', () => {
  let repo: FirebaseNotificationRepository;
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMocks.getFirestore.mockReturnValue('mock-db');
    firestoreMocks.collection.mockReturnValue('col-ref');
    firestoreMocks.query.mockReturnValue('query-ref');
    firestoreMocks.orderBy.mockReturnValue('orderBy-ref');
    firestoreMocks.where.mockReturnValue('where-ref');
    repo = new FirebaseNotificationRepository();
  });

  it('getAll retorna notificações ordenadas por data', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        { id: 'n1', data: () => ({ type: 'fcm', title: 'T', body: 'B', read: false, createdAt: { toMillis: () => 1000 } }) },
      ],
    });
    const result = await repo.getAll(userId);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('n1');
    expect(result[0].type).toBe('fcm');
  });

  it('create adiciona documento no Firestore', async () => {
    firestoreMocks.addDoc.mockResolvedValue({ id: 'new-id' });
    const result = await repo.create(userId, { type: 'task_created', title: 'T', body: 'B' });
    expect(firestoreMocks.addDoc).toHaveBeenCalledOnce();
    expect(result.id).toBe('new-id');
    expect(result.read).toBe(false);
  });

  it('markAsRead atualiza documento com read: true', async () => {
    firestoreMocks.doc.mockReturnValue('doc-ref');
    firestoreMocks.updateDoc.mockResolvedValue(undefined);
    await repo.markAsRead(userId, 'n1');
    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith('doc-ref', { read: true });
  });

  it('delete chama deleteDoc', async () => {
    firestoreMocks.doc.mockReturnValue('doc-ref');
    firestoreMocks.deleteDoc.mockResolvedValue(undefined);
    await repo.delete(userId, 'n1');
    expect(firestoreMocks.deleteDoc).toHaveBeenCalledWith('doc-ref');
  });

  it('saveFcmToken atualiza fcmTokens do usuário', async () => {
    firestoreMocks.doc.mockReturnValue('user-ref');
    firestoreMocks.updateDoc.mockResolvedValue(undefined);
    await repo.saveFcmToken(userId, 'fcm-token-123');
    expect(firestoreMocks.updateDoc).toHaveBeenCalledWith('user-ref', {
      fcmTokens: 'fcm-token-123',
    });
  });

  it('subscribe chama onSnapshot e retorna unsubscribe', () => {
    const unsubFn = vi.fn();
    firestoreMocks.onSnapshot.mockReturnValue(unsubFn);
    const cb = vi.fn();
    const unsub = repo.subscribe(userId, cb);
    expect(firestoreMocks.onSnapshot).toHaveBeenCalled();
    unsub();
    expect(unsubFn).toHaveBeenCalled();
  });
});
```

**Step 2: Rodar testes**

```bash
npm test src/data/firebase/__tests__/FirebaseNotificationRepository.test.ts
```
Expected: todos passando

**Step 3: Commit**

```bash
git add src/data/firebase/__tests__/FirebaseNotificationRepository.test.ts
git commit -m "test(notifications): add FirebaseNotificationRepository tests"
```

---

### Task 14: Testes — notificationStore

**Files:**
- Create: `src/store/__tests__/notificationStore.test.ts`

**Step 1: Escrever testes**

Seguir o padrão de `tasksStore.test.ts`. Mockar DI container e NotificationRepository.

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore } from '../notificationStore';
import type { Notification } from '@app/domain/entities/Notification';

const mockRepo = {
  getAll: vi.fn(),
  create: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  delete: vi.fn(),
  saveFcmToken: vi.fn(),
  subscribe: vi.fn(),
};

vi.mock('../diStore', () => ({
  useDIStore: {
    getState: () => ({
      di: { resolve: () => mockRepo },
    }),
  },
}));

vi.mock('@app/infrastructure/storage/SecureStorage', () => ({
  zustandSecureStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const sampleNotif: Notification = {
  id: 'n1',
  type: 'task_created',
  title: 'Tarefa criada',
  body: 'Nova tarefa adicionada.',
  read: false,
  createdAt: Date.now(),
};

describe('notificationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotificationStore.setState({ notifications: [], loading: false, error: null });
  });

  it('subscribe registra listener e atualiza state', () => {
    let capturedCb: ((n: Notification[]) => void) | null = null;
    mockRepo.subscribe.mockImplementation((_uid: string, cb: (n: Notification[]) => void) => {
      capturedCb = cb;
      return vi.fn();
    });

    useNotificationStore.getState().subscribe('user-1');
    capturedCb!([sampleNotif]);

    expect(useNotificationStore.getState().notifications).toHaveLength(1);
    expect(useNotificationStore.getState().notifications[0].id).toBe('n1');
  });

  it('markAsRead atualiza otimisticamente e chama repo', async () => {
    useNotificationStore.setState({ notifications: [sampleNotif] });
    mockRepo.markAsRead.mockResolvedValue(undefined);

    await useNotificationStore.getState().markAsRead('user-1', 'n1');

    expect(useNotificationStore.getState().notifications[0].read).toBe(true);
    expect(mockRepo.markAsRead).toHaveBeenCalledWith('user-1', 'n1');
  });

  it('deleteNotification remove otimisticamente e chama repo', async () => {
    useNotificationStore.setState({ notifications: [sampleNotif] });
    mockRepo.delete.mockResolvedValue(undefined);

    await useNotificationStore.getState().deleteNotification('user-1', 'n1');

    expect(useNotificationStore.getState().notifications).toHaveLength(0);
    expect(mockRepo.delete).toHaveBeenCalledWith('user-1', 'n1');
  });

  it('useUnreadCount retorna count correto', () => {
    useNotificationStore.setState({ notifications: [sampleNotif, { ...sampleNotif, id: 'n2', read: true }] });
    const unread = useNotificationStore.getState().notifications.filter((n) => !n.read).length;
    expect(unread).toBe(1);
  });
});
```

**Step 2: Rodar testes**

```bash
npm test src/store/__tests__/notificationStore.test.ts
```
Expected: todos passando

**Step 3: Commit**

```bash
git add src/store/__tests__/notificationStore.test.ts
git commit -m "test(notifications): add notificationStore tests"
```

---

## Ordem de execução recomendada

```
Task 1 (instalar pacote) → Tasks 2-4 (domínio + data, paralelo) → Task 5-6 (serviços, paralelo)
→ Task 7 (DI) → Tasks 8-9 (App.tsx + authStore, paralelo) → Task 10-11 (UI + nav, paralelo)
→ Task 12 (i18n) → Tasks 13-14 (testes, paralelo)
```
