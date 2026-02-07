import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { User } from "../domain/entities/User";
import type { AuthRepository } from "../domain/repositories/AuthRepository";
import type { AuthProvider } from "../domain/entities/AuthProvider";

import { TOKENS } from "../core/di/container";
import { useDIStore } from "./diStore";
import { zustandSecureStorage } from "../infrastructure/storage/SecureStorage";

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

const STORAGE_KEY = "@mindease -app/auth:v2";
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
        } catch (e: any) {
          console.error("[authStore] signIn error", e);
        } finally {
          set({ loading: false });
        }
      },
      setPartialProfile(patch) {
        const user = get().user;
        if (!user) return;
        set({ user: { ...user, ...patch } });
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
    const u = await repo.getCurrentUser();
    useAuthStore.setState({ user: u });
  } finally {
    useAuthStore.setState({ loading: false });
    unsubscribe = repo.onAuthStateChanged((u: User | null) => {
      try {
        useAuthStore.setState({ user: u });
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
  type S = ReturnType<typeof useAuthStore.getState>;
  const user = useAuthStore((s: S) => s.user);
  const loading = useAuthStore((s: S) => s.loading);
  const signIn = useAuthStore((s: S) => s.signIn);
  const signUp = useAuthStore((s: S) => s.signUp);
  const signInAnonymously = useAuthStore((s: S) => s.signInAnonymously);
  const signOut = useAuthStore((s: S) => s.signOut);
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
