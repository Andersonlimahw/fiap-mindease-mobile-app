# Clean Architecture & Patterns Reference

This document provides templates and patterns for extending the MindEase mobile app.

## 1. Domain Layer

Entities define the core data structure of the application.

```typescript
// src/domain/entities/Feature.ts
export interface Feature {
  id: string;
  userId: string;
  title: string;
  createdAt: number; // timestamp in ms
  updatedAt?: number;
}

export type CreateFeatureInput = Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateFeatureInput = Partial<Omit<Feature, 'id' | 'userId' | 'createdAt'>>;
```

Repositories define the interface for data access.

```typescript
// src/domain/repositories/FeatureRepository.ts
import type { Feature, CreateFeatureInput, UpdateFeatureInput } from '../entities/Feature';

export interface FeatureRepository {
  getAll(userId: string): Promise<Feature[]>;
  getById(id: string): Promise<Feature | null>;
  create(input: CreateFeatureInput): Promise<Feature>;
  update(id: string, input: UpdateFeatureInput): Promise<Feature>;
  delete(id: string): Promise<void>;
}
```

## 2. Data Layer

We implement both Mock and Firebase repositories.

```typescript
// src/data/mock/MockFeatureRepository.ts
import type { FeatureRepository } from '@app/domain/repositories/FeatureRepository';
import type { Feature, CreateFeatureInput, UpdateFeatureInput } from '@app/domain/entities/Feature';

let mockData: Feature[] = [];

export const MockFeatureRepository: FeatureRepository = {
  async getAll(userId: string) { return mockData.filter(i => i.userId === userId); },
  async getById(id: string) { return mockData.find(i => i.id === id) || null; },
  async create(input: CreateFeatureInput) {
    const newItem: Feature = { ...input, id: `mock-${Date.now()}`, createdAt: Date.now() };
    mockData.push(newItem);
    return newItem;
  },
  async update(id: string, input: UpdateFeatureInput) {
    const index = mockData.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Not found');
    mockData[index] = { ...mockData[index], ...input, updatedAt: Date.now() };
    return mockData[index];
  },
  async delete(id: string) { mockData = mockData.filter(i => i.id !== id); },
};
```

## 3. Application Layer (Use Cases)

Use cases hold business logic and rely on Dependency Injection.

```typescript
// src/application/usecases/CreateFeature.ts
import type { DI } from '@app/core/di/container';
import { TOKENS } from '@app/core/di/container';
import type { CreateFeatureInput } from '@app/domain/entities/Feature';

export function CreateFeature(di: DI) {
  return async (input: CreateFeatureInput) => {
    const repo = di.resolve(TOKENS.FeatureRepository);
    // Add business logic here
    return repo.create(input);
  };
}
```

## 4. State Management (Zustand)

```typescript
// src/store/featureStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandSecureStorage } from '@app/infrastructure/storage/SecureStorage';
import type { Feature } from '@app/domain/entities/Feature';

type FeatureState = {
  data: Feature[];
  loading: boolean;
  fetchData: () => Promise<void>;
};

export const useFeatureStore = create<FeatureState>()(
  persist(
    (set, get) => ({
      data: [],
      loading: false,
      fetchData: async () => {
        set({ loading: true });
        // Use case logic goes here
        set({ loading: false });
      },
    }),
    {
      name: 'mindease-feature',
      storage: createJSONStorage(() => zustandSecureStorage),
    }
  )
);

export const useFeatureData = () => useFeatureStore((s) => s.data);
export const useFeatureActions = () => useFeatureStore((s) => ({ fetchData: s.fetchData }));
```

## 5. Presentation Layer

```typescript
// src/presentation/components/FeatureCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@app/presentation/theme/theme';

interface FeatureCardProps {
  title: string;
}

export function FeatureCard({ title }: FeatureCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```
