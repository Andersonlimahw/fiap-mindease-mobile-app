# Copilot Instructions for MindEase Mobile App

This guide helps Copilot understand the structure, conventions, and workflows for contributing to the MindEase Mobile app (React Native + Expo).

## Build, Test, and Development Commands

### Quick Reference

```bash
# Development
npm run start              # Start Metro bundler (required first)
npm run ios               # Build + run on iOS simulator
npm run android           # Build + run on Android emulator

# Testing
npm run test              # Run tests in watch mode
npm run test:run          # Run tests once
npm run test:coverage     # Generate coverage report
npm run typecheck         # Check TypeScript without emitting

# Cleaning
npm run clean             # Full dependency + cache clean
npm run clean:ios         # Clean iOS build artifacts
npm run clean:android     # Clean Android build artifacts
npm run reset:all         # Nuclear option: clean everything and reinstall
```

### Important Notes

- **Never use Expo Go** — always use native builds via `npm run ios` or `npm run android`
- The app ships native modules (Google/Apple Auth, Firebase) that don't work in Expo Go
- Mock mode is available for development without Firebase: set `EXPO_PUBLIC_USE_MOCK=true`
- Running with Firebase requires `.env` setup with Firebase credentials

### Testing Single Files

```bash
# Run tests matching a pattern
npm run test -- --include="**/authStore.test.ts"

# Run tests for a specific file (watch mode)
npm run test src/store/authStore.test.ts

# Run tests once for a specific file
npm run test:run -- src/store/authStore.test.ts
```

## Architecture Overview

### Clean Architecture + MVVM

The codebase follows strict layer separation:

```
Domain (entities, interfaces)
    ↓
Application (use cases)
    ↓
Infrastructure (platform services: Firebase, storage, cache)
    ↓
Presentation (screens, components, theme)
    ↓
Store (Zustand state management)
```

**Key Points:**
- Domain layer is pure TypeScript—no React, no platform-specific code
- Data repositories have mock implementations for testing (default) and Firebase implementations
- Use cases orchestrate domain logic and repository calls
- Screens/components consume use cases via custom hooks or Zustand stores

### Directory Structure

```
src/
├── application/usecases/     # Business rules, service orchestration
├── config/                   # Environment configuration
├── core/di/                  # Dependency injection container + tokens
├── data/
│   ├── firebase/             # Repository implementations using Firebase
│   ├── mock/                 # Mock repository implementations (default)
│   ├── b3/                   # B3 API integration
│   ├── currency/             # Currency API integration
│   └── google/               # Google Auth integration
├── domain/
│   ├── entities/             # Domain models (User, Task, etc.)
│   ├── repositories/         # Repository interfaces (abstract)
│   └── validation/           # Zod schemas for input validation
├── infrastructure/
│   ├── cache/                # CacheManager (TTL, strategies)
│   ├── firebase/             # Firebase initialization
│   └── storage/              # SecureStorage (MMKV + Keychain)
├── presentation/
│   ├── components/           # Reusable UI components
│   ├── hooks/                # Custom hooks (useBiometricAuth, useDebounce, etc.)
│   ├── i18n/                 # Internationalization setup
│   ├── navigation/           # React Navigation configuration
│   ├── screens/              # Screen components (one per feature)
│   └── theme/                # Theme tokens (colors, spacing, radius)
├── store/                    # Zustand stores (state + selectors)
├── types/                    # Global TypeScript types
└── utils/                    # Utility functions (formatting, helpers)
```

## Code Conventions

### File Naming & Structure

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase.tsx | `TaskCard.tsx` |
| Component styles | `ComponentName.styles.ts` | `TaskCard.styles.ts` |
| Hooks | camelCase, prefix `use` | `useBiometricAuth.ts` |
| Entities | PascalCase.ts | `Task.ts` |
| Repositories (interface) | `RepositoryName.ts` | `TaskRepository.ts` |
| Repositories (mock) | `MockRepositoryName.ts` | `MockTaskRepository.ts` |
| Repositories (Firebase) | `FirebaseRepositoryName.ts` | `FirebaseTaskRepository.ts` |
| Stores | camelCase, suffix `Store` | `taskStore.ts` |
| Use cases | PascalCase.ts | `CreateTask.ts` |

### Import Aliases

Always use path aliases (defined in `tsconfig.json`):

```typescript
// ✓ Good
import { Task } from '@domain/entities/Task';
import { useTaskStore } from '@store/taskStore';
import { TaskCard } from '@components/TaskCard';

// ✗ Avoid
import { Task } from '../../../domain/entities/Task';
import { useTaskStore } from '../../../store/taskStore';
```

### Zustand Store Pattern

Stores must include:
- Type definition for state
- Individual selectors (not just the whole store) to prevent unnecessary re-renders
- Persist middleware with secure storage
- Partialize to avoid persisting loading states

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandSecureStorage } from '@infrastructure/storage/SecureStorage';

type TaskState = {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  
  fetchTasks: (userId: string) => Promise<void>;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      loading: false,
      error: null,
      
      fetchTasks: async (userId: string) => {
        set({ loading: true });
        try {
          // Fetch logic
        } catch (error) {
          set({ error: String(error) });
        } finally {
          set({ loading: false });
        }
      },
      
      addTask: (task: Task) => {
        set((state) => ({ tasks: [...state.tasks, task] }));
      },
      
      updateTask: (id: string, updates: Partial<Task>) => {
        set((state) => ({
          tasks: state.tasks.map((t) => t.id === id ? { ...t, ...updates } : t),
        }));
      },
      
      deleteTask: (id: string) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },
    }),
    {
      name: 'mindease-tasks',
      storage: createJSONStorage(() => zustandSecureStorage),
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);

// Individual selectors (performance)
export const useTasksData = () => useTaskStore((s) => s.tasks);
export const useTasksLoading = () => useTaskStore((s) => s.loading);
export const useTasksActions = () =>
  useTaskStore((s) => ({
    fetchTasks: s.fetchTasks,
    addTask: s.addTask,
    updateTask: s.updateTask,
    deleteTask: s.deleteTask,
  }));
```

### Component Structure

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './TaskCard.styles';
import { useTheme } from '@presentation/theme/theme';

interface TaskCardProps {
  title: string;
  completed?: boolean;
  onPress?: () => void;
}

export function TaskCard({ title, completed, onPress }: TaskCardProps) {
  const theme = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.title,
          { color: theme.colors.text },
          completed && styles.completedTitle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
```

### Style Files

```typescript
// TaskCard.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
});
```

### DI Container Usage

```typescript
// Register in src/core/di/container.tsx
export const TOKENS = {
  AuthRepository: Symbol("AuthRepository") as Token<AuthRepository>,
  TaskRepository: Symbol("TaskRepository") as Token<TaskRepository>,
};

// Resolve in use cases
export function CreateTask(di: DI) {
  return async (input: CreateTaskInput) => {
    const taskRepo = di.resolve(TOKENS.TaskRepository);
    return taskRepo.create(input);
  };
}
```

### Theme Usage

Always use the centralized theme hook instead of hardcoding colors:

```typescript
import { useTheme } from '@presentation/theme/theme';

const theme = useTheme();
// Access: theme.colors, theme.spacing, theme.radius, theme.text
// Available: mindease/neon brands, light/dark modes
```

### Input Validation with Zod

Define schemas in `src/domain/validation/`:

```typescript
import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title required').max(100),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
```

Use in repositories:

```typescript
export async function create(input: CreateTaskInput): Promise<Task> {
  const validated = CreateTaskSchema.parse(input);
  // Proceed with validated input
}
```

## Feature Migration Workflow

When porting a feature from MindEase Web to mobile:

1. **Create Domain Layer**
   - Entity in `src/domain/entities/FeatureName.ts`
   - Repository interface in `src/domain/repositories/FeatureNameRepository.ts`
   - Validation schema in `src/domain/validation/`

2. **Create Data Layer**
   - Mock repository in `src/data/mock/MockFeatureNameRepository.ts`
   - Firebase repository in `src/data/firebase/FirebaseFeatureNameRepository.ts`

3. **Create Application Layer**
   - Use cases in `src/application/usecases/` (e.g., CreateFeature, UpdateFeature)

4. **Register in DI**
   - Add token to `TOKENS` in `src/core/di/container.tsx`
   - Wire in `App.tsx` DI setup

5. **Create Store** (if needed)
   - Zustand store in `src/store/featureName.ts`
   - Include selectors for performance

6. **Create Presentation**
   - Screen in `src/presentation/screens/FeatureName/FeatureNameScreen.tsx`
   - Styles in `src/presentation/screens/FeatureName/FeatureNameScreen.styles.ts`
   - Components in `src/presentation/components/`
   - Add to navigation in `src/presentation/navigation/`

7. **Internationalization**
   - Add translation keys to i18n files
   - Use `const { t } = useI18n()` in screens

## Testing

- Test files: `**/*.test.ts` or `**/*.spec.ts`
- Configured via `vitest.config.ts`
- Coverage tracked for `src/store/**` and `src/domain/**`
- Setup file: `src/__tests__/setup.ts`

Example test:

```typescript
import { describe, it, expect } from 'vitest';
import { useTaskStore } from '@store/taskStore';

describe('Task Store', () => {
  it('should add a task', () => {
    const { addTask, tasks } = useTaskStore.getState();
    addTask({ id: '1', title: 'Test' });
    expect(useTaskStore.getState().tasks).toHaveLength(1);
  });
});
```

## Key Dependencies & When to Use

| Package | Purpose | Notes |
|---------|---------|-------|
| `zustand` | State management | Use for global app state, always with persist + selectors |
| `zod` | Input validation | Define schemas in `domain/validation/` |
| `firebase` | Backend | Implementations in `data/firebase/` |
| `expo-secure-store` | Secure storage for auth tokens | Use SecureStorage wrapper |
| `expo-local-authentication` | Biometric auth | Use useBiometricAuth hook |
| `@shopify/flash-list` | High-perf lists | Replace FlatList for large lists |
| `@react-navigation/...` | Navigation | Configured in `presentation/navigation/` |
| `react-native-mmkv` | Encrypted storage | Wrapped by SecureStorage |

## Environment Variables

Mock mode (default for development):
```bash
EXPO_PUBLIC_USE_MOCK=true
```

Firebase mode:
```bash
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
# See .env.example for full list
```

Theme preferences:
```bash
EXPO_PUBLIC_BRAND=mindease|neon
EXPO_PUBLIC_THEME_MODE=light|dark
```

## Common Gotchas

1. **Never use Expo Go** — the app has native dependencies
2. **Always use alias imports** — makes refactoring easier
3. **Don't persist loading states** — use `partialize` in Zustand stores
4. **Use individual selectors** — prevents unnecessary component re-renders
5. **Validate user input** — always use Zod schemas
6. **Use SecureStorage for sensitive data** — auth tokens, user PII
7. **Don't forget cleanup in hooks** — unsubscribe from Firebase listeners
8. **Use useTheme() for colors** — enables runtime theme switching

## TypeScript & Linting

- Strict mode enabled
- Run `npm run typecheck` before committing
- No `any` types allowed (use generics instead)
- File aliases prevent common path resolution issues

## Firebase Schema

Reference collections for common features:

```
tasks/
├── userId (string)
├── title (string)
├── description (string)
├── priority ('low'|'medium'|'high')
├── completed (boolean)
├── createdAt (serverTimestamp)
└── updatedAt (serverTimestamp)

pomodoroSessions/
├── userId (string)
├── mode (string)
├── duration (number)
├── completedAt (serverTimestamp)

focusSessions/
├── userId (string)
├── duration (number)
├── actualDuration (number)
├── ambientSound (string)
└── startedAt (serverTimestamp)
```

Note: Create composite indexes in Firebase console as prompted by the app.
