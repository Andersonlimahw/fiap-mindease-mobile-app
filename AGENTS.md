# AGENTS.md - MindEase Mobile Subagents

## Overview

This document defines specialized subagents for migrating MindEase Web features to React Native while following the established Clean Architecture + MVVM patterns.

---

## Agent: feature-migrator

**Purpose**: Migrate a complete feature from web to mobile following all architecture layers.

**Trigger**: When migrating a feature like Tasks, Pomodoro, Focus Mode, etc.

**Tools**: Read, Write, Edit, Glob, Grep, Bash

### Workflow

1. **Analyze Web Feature**
   - Read web component from `.tmp/fiap-mindease-frontend-web/src/`
   - Read web store from `.tmp/fiap-mindease-frontend-web/src/stores/`
   - Identify dependencies and APIs

2. **Create Domain Layer**
   - Create entity in `src/domain/entities/`
   - Create repository interface in `src/domain/repositories/`
   - Add validation schemas to `src/domain/validation/` if needed

3. **Create Data Layer**
   - Create mock repository in `src/data/mock/`
   - Create Firebase repository in `src/data/firebase/` if applicable

4. **Create Application Layer**
   - Create use cases in `src/application/usecases/`

5. **Create Store**
   - Create Zustand store in `src/store/`
   - Follow authStore pattern with selectors

6. **Update DI Container**
   - Add token to `src/core/di/container.tsx`
   - Wire repository in App.tsx

7. **Create Presentation Layer**
   - Create screen in `src/presentation/screens/`
   - Create styles file
   - Add to navigation if needed

8. **Create Components**
   - Create shared components in `src/presentation/components/`

---

## Agent: store-creator

**Purpose**: Create Zustand stores following the project pattern.

**Trigger**: When a new store is needed for a feature.

### Template

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandSecureStorage } from '@app/infrastructure/storage/SecureStorage';

// Types
type FeatureState = {
  // State properties
  data: DataType[];
  loading: boolean;

  // Actions
  fetchData: () => Promise<void>;
  addItem: (item: DataType) => void;
  updateItem: (id: string, updates: Partial<DataType>) => void;
  deleteItem: (id: string) => void;
};

// Store
export const useFeatureStore = create<FeatureState>()(
  persist(
    (set, get) => ({
      data: [],
      loading: false,

      fetchData: async () => {
        set({ loading: true });
        try {
          // Fetch logic
        } finally {
          set({ loading: false });
        }
      },

      addItem: (item) => {
        set((state) => ({ data: [...state.data, item] }));
      },

      updateItem: (id, updates) => {
        set((state) => ({
          data: state.data.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      deleteItem: (id) => {
        set((state) => ({
          data: state.data.filter((item) => item.id !== id),
        }));
      },
    }),
    {
      name: 'mindease-feature',
      storage: createJSONStorage(() => zustandSecureStorage),
      partialize: (state) => ({ data: state.data }),
    }
  )
);

// Individual selectors (performance)
export const useFeatureData = () => useFeatureStore((s) => s.data);
export const useFeatureLoading = () => useFeatureStore((s) => s.loading);
export const useFeatureActions = () =>
  useFeatureStore((s) => ({
    fetchData: s.fetchData,
    addItem: s.addItem,
    updateItem: s.updateItem,
    deleteItem: s.deleteItem,
  }));
```

---

## Agent: component-creator

**Purpose**: Create React Native components with proper styling.

### Template

```typescript
// ComponentName.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './ComponentName.styles';
import { useTheme } from '@app/presentation/theme/theme';

interface ComponentNameProps {
  title: string;
  onPress?: () => void;
}

export function ComponentName({ title, onPress }: ComponentNameProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
```

```typescript
// ComponentName.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
});
```

---

## Agent: screen-creator

**Purpose**: Create screens with navigation integration.

### Template

```typescript
// ScreenName/ScreenNameScreen.tsx
import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './ScreenNameScreen.styles';
import { useTheme } from '@app/presentation/theme/theme';
import { useI18n } from '@app/presentation/i18n/I18nProvider';

export function ScreenNameScreen() {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('screenName.title')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Agent: entity-creator

**Purpose**: Create domain entities with types.

### Template

```typescript
// src/domain/entities/EntityName.ts
export interface EntityName {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: number; // timestamp ms
  updatedAt?: number;
}

export type CreateEntityNameInput = Omit<EntityName, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEntityNameInput = Partial<Omit<EntityName, 'id' | 'userId' | 'createdAt'>>;
```

---

## Agent: repository-creator

**Purpose**: Create repository interface and implementations.

### Interface Template

```typescript
// src/domain/repositories/EntityNameRepository.ts
import type { EntityName, CreateEntityNameInput, UpdateEntityNameInput } from '../entities/EntityName';

export interface EntityNameRepository {
  getAll(userId: string): Promise<EntityName[]>;
  getById(id: string): Promise<EntityName | null>;
  create(input: CreateEntityNameInput): Promise<EntityName>;
  update(id: string, input: UpdateEntityNameInput): Promise<EntityName>;
  delete(id: string): Promise<void>;
  subscribe(userId: string, callback: (items: EntityName[]) => void): () => void;
}
```

### Mock Implementation Template

```typescript
// src/data/mock/MockEntityNameRepository.ts
import type { EntityNameRepository } from '@app/domain/repositories/EntityNameRepository';
import type { EntityName, CreateEntityNameInput, UpdateEntityNameInput } from '@app/domain/entities/EntityName';

let mockData: EntityName[] = [];
let listeners: ((items: EntityName[]) => void)[] = [];

const notify = () => {
  listeners.forEach((cb) => cb([...mockData]));
};

export const MockEntityNameRepository: EntityNameRepository = {
  async getAll(userId: string) {
    return mockData.filter((item) => item.userId === userId);
  },

  async getById(id: string) {
    return mockData.find((item) => item.id === id) || null;
  },

  async create(input: CreateEntityNameInput) {
    const newItem: EntityName = {
      ...input,
      id: `mock-${Date.now()}`,
      createdAt: Date.now(),
    };
    mockData.push(newItem);
    notify();
    return newItem;
  },

  async update(id: string, input: UpdateEntityNameInput) {
    const index = mockData.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Not found');
    mockData[index] = { ...mockData[index], ...input, updatedAt: Date.now() };
    notify();
    return mockData[index];
  },

  async delete(id: string) {
    mockData = mockData.filter((item) => item.id !== id);
    notify();
  },

  subscribe(userId: string, callback: (items: EntityName[]) => void) {
    const wrappedCb = (items: EntityName[]) => {
      callback(items.filter((item) => item.userId === userId));
    };
    listeners.push(wrappedCb);
    wrappedCb(mockData);
    return () => {
      listeners = listeners.filter((cb) => cb !== wrappedCb);
    };
  },
};
```

---

## Agent: usecase-creator

**Purpose**: Create application use cases.

### Template

```typescript
// src/application/usecases/CreateEntityName.ts
import type { DI } from '@app/core/di/container';
import { TOKENS } from '@app/core/di/container';
import type { CreateEntityNameInput } from '@app/domain/entities/EntityName';

export function CreateEntityName(di: DI) {
  return async (input: CreateEntityNameInput) => {
    const repo = di.resolve(TOKENS.EntityNameRepository);
    return repo.create(input);
  };
}
```

---

## Feature Migration Checklist

For each feature being migrated:

- [ ] Domain Entity created
- [ ] Repository Interface created
- [ ] Mock Repository implemented
- [ ] Firebase Repository implemented (if needed)
- [ ] DI Token registered
- [ ] Use Cases created
- [ ] Zustand Store created with selectors
- [ ] Screen created with styles
- [ ] Components created
- [ ] Navigation updated
- [ ] i18n keys added
- [ ] Documentation updated
