import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { User } from "@domain/entities/User";
import type { AuthRepository } from "@domain/repositories/AuthRepository";
import type { AuthProvider } from "@domain/entities/AuthProvider";

import { TOKENS } from "@core/di/container";
import { useDIStore } from "./diStore";
import { zustandSecureStorage } from "@infrastructure/storage/SecureStorage";
import { FirebaseAPI } from "@infrastructure/firebase/firebase";
import { NotificationService } from "@app/infrastructure/notifications/NotificationService";
import { useNotificationStore } from "./notificationStore";

type AuthState = {
  isHydrated: boolean;
  isAuthenticated: () => boolean;
  setPartialProfile: (partial: Partial<User>) => void;
  user: User | null | undefined; // undefined while initializing
  loading: boolean;
  signIn: (
    provider: AuthProvider,
    options?: { email?: string; password?: string }
  ) => Promise<void>;
  signUp: (options: { email: string; password: string }) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
};

type PersistShape = {
  user: AuthState["user"] | null;
  _persistVersion: number; // para migrations
};

let initialized = false;
let unsubscribe: (() => void) | undefined;

const STORAGE_KEY = "@mindease-app/auth:v2";
const STORAGE_VERSION = 2;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isHydrated: false,

      user: undefined,
      loading: true,
      async signIn(
        provider: AuthProvider,
        options?: { email?: string; password?: string }
      ) {
        const repo = useDIStore
          .getState()
          .di.resolve<AuthRepository>(TOKENS.AuthRepository);
        set({ loading: true });
        try {
          const providerResult = await repo.signIn(provider, options);
          set({ user: providerResult });
          FirebaseAPI.setCurrentUserId(providerResult?.id || null);
          // Salvar token FCM e iniciar listener de notificações
          if (providerResult?.id) {
            NotificationService.getFcmToken().then((token) => {
              if (token) {
                useNotificationStore.getState().saveFcmToken(providerResult.id, token);
              }
            }).catch(() => {});
            // Iniciar listener real-time de notificações
            useNotificationStore.getState().subscribe(providerResult.id);
            // Handler para mensagens FCM em foreground → salvar no inbox
            NotificationService.setOnMessageHandler((title, body, data) => {
              useNotificationStore.getState().addFcmNotification(providerResult.id, title, body, data);
            });
          }
        } catch (e: any) {
          console.error("[authStore] signIn error", e);
        } finally {
          set({ loading: false });
        }
      },
      setPartialProfile(patch) {
        const user = get().user;
        if (!user) return;
        const updated = { ...user, ...patch };
        set({ user: updated });
        FirebaseAPI.setCurrentUserId(updated.id);
      },
      async signUp(options: { email: string; password: string }) {
        const repo = useDIStore
          .getState()
          .di.resolve<AuthRepository>(TOKENS.AuthRepository);
        set({ loading: true });
        try {
          await repo.signUp(options);
          const u = await repo.getCurrentUser();
          set({ user: u });
          FirebaseAPI.setCurrentUserId(u?.id || null);
          // Salvar token FCM e iniciar listener de notificações
          if (u?.id) {
            NotificationService.getFcmToken().then((token) => {
              if (token) {
                useNotificationStore.getState().saveFcmToken(u.id, token);
              }
            }).catch(() => {});
            // Iniciar listener real-time de notificações
            useNotificationStore.getState().subscribe(u.id);
            // Handler para mensagens FCM em foreground → salvar no inbox
            NotificationService.setOnMessageHandler((title, body, data) => {
              useNotificationStore.getState().addFcmNotification(u.id, title, body, data);
            });
          }
        } finally {
          set({ loading: false });
        }
      },
      async signInAnonymously() {
        const repo = useDIStore
          .getState()
          .di.resolve<AuthRepository>(TOKENS.AuthRepository);
        set({ loading: true });
        try {
          await repo.signIn("anonymous");
          const u = await repo.getCurrentUser();
          set({ user: u });
          FirebaseAPI.setCurrentUserId(u?.id || null);
          // Salvar token FCM e iniciar listener de notificações
          if (u?.id) {
            NotificationService.getFcmToken().then((token) => {
              if (token) {
                useNotificationStore.getState().saveFcmToken(u.id, token);
              }
            }).catch(() => {});
            // Iniciar listener real-time de notificações
            useNotificationStore.getState().subscribe(u.id);
            // Handler para mensagens FCM em foreground → salvar no inbox
            NotificationService.setOnMessageHandler((title, body, data) => {
              useNotificationStore.getState().addFcmNotification(u.id, title, body, data);
            });
          }
        } finally {
          set({ loading: false });
        }
      },
      async signOut() {
        const repo = useDIStore
          .getState()
          .di.resolve<AuthRepository>(TOKENS.AuthRepository);
        set({ loading: true });
        try {
          await repo.signOut();
          set({ user: null });
          FirebaseAPI.setCurrentUserId(null);
          NotificationService.cleanup();
        } finally {
          set({ loading: false });
        }
      },
      isAuthenticated: () => !!get().user,
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      // Usa SecureStorage com MMKV criptografado ao invés de AsyncStorage
      storage: createJSONStorage(() => zustandSecureStorage),
      partialize: (state): PersistShape => {
        return {
          user: state.user,
          _persistVersion: STORAGE_VERSION,
        };
      },
      onRehydrateStorage: (state) => {
        // If the rehydrated user has a numeric-only ID, it's an old Google ID
        // that hasn't been unified with Firebase UID.
        if (state && state.user && /^\d+$/.test(state.user.id)) {
          console.log("[authStore] Invalidating old numeric Google ID:", state.user.id);
          state.user = null;
          FirebaseAPI.setCurrentUserId(null);
        }

        state &&
          state.isHydrated == false &&
          state &&
          (state.isHydrated = true);
      },
      migrate: async (persisted, version) => {
        if (!persisted) return persisted;
        if (version === 1) {
          return {
            ...persisted,
            _persistVersion: STORAGE_VERSION,
          };
        }
        return persisted;
      },
    }
  )
);

export async function initAuthStore() {
  if (initialized) return;
  initialized = true;
  const repo = useDIStore
    .getState()
    .di.resolve<AuthRepository>(TOKENS.AuthRepository);
  try {
    let u = await repo.getCurrentUser();
    
    // Safety check: if we somehow got a numeric Google ID, ignore it and force sign-in
    if (u && /^\d+$/.test(u.id)) {
      console.warn("[authStore] init found old numeric Google ID, clearing session:", u.id);
      await repo.signOut();
      u = null;
    }
    
    useAuthStore.setState({ user: u });
    FirebaseAPI.setCurrentUserId(u?.id || null);
    // Salvar token FCM e iniciar listener de notificações para sessão restaurada
    if (u?.id) {
      NotificationService.getFcmToken().then((token) => {
        if (token) {
          useNotificationStore.getState().saveFcmToken(u.id, token);
        }
      }).catch(() => {});
      useNotificationStore.getState().subscribe(u.id);
      NotificationService.setOnMessageHandler((title, body, data) => {
        useNotificationStore.getState().addFcmNotification(u.id, title, body, data);
      });
    }
  } finally {
    useAuthStore.setState({ loading: false });
    unsubscribe = repo.onAuthStateChanged((u: User | null) => {
      try {
        // Same safety check for auth state changes
        if (u && /^\d+$/.test(u.id)) {
          console.warn("[authStore] state change found old numeric Google ID:", u.id);
          repo.signOut();
          useAuthStore.setState({ user: null });
          FirebaseAPI.setCurrentUserId(null);
          NotificationService.cleanup();
          return;
        }

        useAuthStore.setState({ user: u });
        FirebaseAPI.setCurrentUserId(u?.id || null);
        if (u?.id) {
          // Salvar token FCM e iniciar listener de notificações
          NotificationService.getFcmToken().then((token) => {
            if (token) {
              useNotificationStore.getState().saveFcmToken(u.id, token);
            }
          }).catch(() => {});
          useNotificationStore.getState().subscribe(u.id);
          NotificationService.setOnMessageHandler((title, body, data) => {
            useNotificationStore.getState().addFcmNotification(u.id, title, body, data);
          });
        } else {
          NotificationService.cleanup();
        }
      } catch (error) {
        console.error("[authStore] Failed to handle auth state change:", error);
      }
    });
  }
}

export function teardownAuthStore() {
  if (unsubscribe) unsubscribe();
  unsubscribe = undefined;
  initialized = false;
  NotificationService.cleanup();
}

// ============================================
// SELECTORS OTIMIZADOS (evita re-renders)
// ============================================

// Seletores individuais para componentes que precisam apenas de parte do estado
export const useAuthUser = () => useAuthStore((s) => s.user);
export const useAuthLoading = () => useAuthStore((s) => s.loading);
export const useIsHydrated = () => useAuthStore((s) => s.isHydrated);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);

// Seletores de ações (estáveis, não causam re-render)
export const useAuthActions = () =>
  useAuthStore((s) => ({
    signIn: s.signIn,
    signUp: s.signUp,
    signInAnonymously: s.signInAnonymously,
    signOut: s.signOut,
    setPartialProfile: s.setPartialProfile,
  }));

// Convenience typed selector hook, Redux-like ergonomics
// NOTA: Este hook causa re-render quando QUALQUER parte do estado muda
// Para melhor performance, use os seletores individuais acima
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signInAnonymously = useAuthStore((s) => s.signInAnonymously);
  const signOut = useAuthStore((s) => s.signOut);
  const setPartialProfile = useAuthStore((s) => s.setPartialProfile);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  return {
    user,
    loading,
    signIn,
    signUp,
    signInAnonymously,
    signOut,
    isHydrated,
    isAuthenticated,
    setPartialProfile,
  } as const;
}
