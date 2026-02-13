import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAuthStore, initAuthStore, teardownAuthStore } from '../authStore';
import { useDIStore } from '@store/diStore';
import { TOKENS } from '@app/core/di/container';
import type { AuthRepository } from '@app/domain/repositories/AuthRepository';
import type { User } from '@app/domain/entities/User';
import type { AuthProvider } from '@app/domain/entities/AuthProvider';

const createAuthRepoMock = () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(),
  onAuthStateChanged: vi.fn(),
});

const mockedUseDIStore = useDIStore as unknown as {
  getState: ReturnType<typeof vi.fn>;
};

const mockDIWithRepo = (repo: ReturnType<typeof createAuthRepoMock>) => {
  mockedUseDIStore.getState.mockReturnValue({
    di: {
      resolve: vi.fn((token: unknown) => {
        if (token === TOKENS.AuthRepository) {
          return repo as unknown as AuthRepository;
        }
        throw new Error(`Unexpected token ${String(token)}`);
      }),
    },
  });
};

describe('authStore', () => {
  let repo: ReturnType<typeof createAuthRepoMock>;
  const baseUser: User = { id: 'user-1', name: 'Test User', email: 'test@mindease.app' };

  beforeEach(() => {
    repo = createAuthRepoMock();
    mockDIWithRepo(repo);
    useAuthStore.setState({ user: undefined, loading: false, isHydrated: false });
    vi.clearAllMocks();
    teardownAuthStore();
  });

  afterEach(() => {
    teardownAuthStore();
  });

  it('should expose initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeUndefined();
    expect(state.loading).toBe(false);
    expect(state.isHydrated).toBe(false);
  });

  it('signIn should update user and toggle loading state', async () => {
    repo.signIn.mockResolvedValue(baseUser);

    const promise = useAuthStore.getState().signIn('google' as AuthProvider);
    expect(useAuthStore.getState().loading).toBe(true);

    await promise;

    expect(repo.signIn).toHaveBeenCalledWith('google', undefined);
    expect(useAuthStore.getState().user).toEqual(baseUser);
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('signOut should clear the user and call repository', async () => {
    useAuthStore.setState({ user: baseUser });
    repo.signOut.mockResolvedValue(undefined);

    await useAuthStore.getState().signOut();

    expect(repo.signOut).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('signUp should refresh current user after registration', async () => {
    repo.signUp.mockResolvedValue(baseUser);
    repo.getCurrentUser.mockResolvedValue(baseUser);

    await useAuthStore.getState().signUp({ email: 'test@mindease.app', password: '123456' });

    expect(repo.signUp).toHaveBeenCalledWith({ email: 'test@mindease.app', password: '123456' });
    expect(repo.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toEqual(baseUser);
  });

  it('setPartialProfile should merge profile data', () => {
    useAuthStore.setState({ user: baseUser });
    useAuthStore.getState().setPartialProfile({ name: 'Updated' });

    expect(useAuthStore.getState().user).toEqual({ ...baseUser, name: 'Updated' });
  });

  it('initAuthStore should bootstrap current user and subscribe to auth changes', async () => {
    const updatedUser: User = { id: 'user-2', name: 'Another' };
    const unsubscribe = vi.fn();
    repo.getCurrentUser.mockResolvedValue(baseUser);
    let listener: (user: User | null) => void = () => {};
    repo.onAuthStateChanged.mockImplementation((cb) => {
      listener = cb;
      return unsubscribe;
    });

    await initAuthStore();

    expect(repo.getCurrentUser).toHaveBeenCalledTimes(1);
    expect(repo.onAuthStateChanged).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toEqual(baseUser);

    listener(updatedUser);
    expect(useAuthStore.getState().user).toEqual(updatedUser);

    listener(null);
    expect(useAuthStore.getState().user).toBeNull();

    teardownAuthStore();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('initAuthStore should be idempotent until teardown', async () => {
    repo.getCurrentUser.mockResolvedValue(baseUser);
    repo.onAuthStateChanged.mockReturnValue(vi.fn());

    await initAuthStore();
    await initAuthStore();

    expect(repo.getCurrentUser).toHaveBeenCalledTimes(1);

    teardownAuthStore();
    repo.getCurrentUser.mockClear();
    await initAuthStore();
    expect(repo.getCurrentUser).toHaveBeenCalledTimes(1);
  });
});
