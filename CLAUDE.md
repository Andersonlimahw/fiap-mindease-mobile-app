# CLAUDE.md - MindEase Mobile App

## Project Overview

MindEase Mobile is a React Native (Expo) application that ports the MindEase web productivity platform to mobile. The app follows MVVM + Clean Architecture with SOLID principles and a lightweight DI container.

## Quick Start

```bash
# Install dependencies
npm install

# Start Metro bundler
npm run start

# Run on iOS/Android (requires native build, not Expo Go)
npm run ios
npm run android
```

**IMPORTANT**: Never use Expo Go. Always use prebuild + native builds.

## Architecture

### Layer Structure (Clean Architecture)

```
src/
├── application/         # Use cases (business rules)
│   └── usecases/       # SignIn, SignOut, etc.
├── config/             # Environment configuration
├── core/               # DI container and tokens
│   └── di/
├── data/               # Repository implementations
│   ├── firebase/       # Firebase implementations
│   ├── mock/           # Mock implementations
│   ├── b3/             # B3 API quotes
│   ├── currency/       # Currency API
│   └── google/         # Google Auth
├── domain/             # Entities and interfaces
│   ├── entities/       # User, Transaction, Task, etc.
│   ├── repositories/   # Repository interfaces
│   └── validation/     # Zod schemas
├── infrastructure/     # Platform services
│   ├── cache/          # CacheManager
│   ├── firebase/       # Firebase init
│   └── storage/        # SecureStorage (MMKV)
├── presentation/       # UI layer
│   ├── components/     # Shared components
│   ├── hooks/          # Custom hooks
│   ├── i18n/           # Internationalization
│   ├── navigation/     # React Navigation
│   ├── screens/        # Screen components
│   └── theme/          # Theme system
└── store/              # Zustand stores
```

### MVVM Pattern

- **Model**: Domain entities + repositories
- **ViewModel**: Custom hooks/stores that consume use cases
- **View**: React Native screens/components

### DI Container

```typescript
// Tokens defined in src/core/di/container.tsx
import { TOKENS } from '@app/core/di/container';

// Resolve dependencies via useDIStore
const repo = useDIStore.getState().di.resolve(TOKENS.TransactionRepository);
```

## Code Conventions

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` prefixed with `use`
- Styles: `ComponentName.styles.ts`
- Stores: `camelCase.ts` suffixed with `Store`
- Entities: `PascalCase.ts`
- Repositories: `PascalCase.ts` prefixed with interface/implementation

### Import Aliases

```typescript
import { Component } from '@app/presentation/components/Component';
import { useAuth } from '@store/authStore';
import { User } from '@app/domain/entities/User';
```

### Zustand Store Pattern

```typescript
// Store with selectors for performance
export const useFeatureStore = create<FeatureState>()(
  persist(
    (set, get) => ({
      // State
      data: [],
      loading: false,

      // Actions
      fetchData: async () => {
        set({ loading: true });
        try {
          const result = await api.fetch();
          set({ data: result });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'feature-store-key',
      storage: createJSONStorage(() => zustandSecureStorage),
    }
  )
);

// Individual selectors (prevent re-renders)
export const useFeatureData = () => useFeatureStore(s => s.data);
export const useFeatureLoading = () => useFeatureStore(s => s.loading);
```

### Component Structure

```typescript
// ComponentName.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './ComponentName.styles';
import { useTheme } from '@app/presentation/theme/theme';

interface ComponentNameProps {
  title: string;
}

export function ComponentName({ title }: ComponentNameProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
    </View>
  );
}
```

### Styles Pattern

```typescript
// ComponentName.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
```

## Theme System

Use the centralized theme hook:

```typescript
import { useTheme } from '@app/presentation/theme/theme';

const theme = useTheme();
// Access: theme.colors, theme.spacing, theme.radius, theme.text
```

Brands: `mindease` | `neon`
Modes: `light` | `dark`

## Navigation

```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();
navigation.navigate('ScreenName');
```

Screens with lazy loading use `withSuspense` HOC.

## i18n

```typescript
import { useI18n } from '@app/presentation/i18n/I18nProvider';

const { t } = useI18n();
// Usage: t('screen.key')
```

## Key Dependencies

- `expo` - SDK 54
- `react-native` - 0.75 (managed by Expo)
- `zustand` - State management
- `zod` - Validation
- `firebase` - Backend
- `@shopify/flash-list` - High-performance lists
- `react-native-mmkv` - Encrypted storage
- `expo-local-authentication` - Biometrics

## Commands

```bash
npm run start          # Start Metro
npm run ios            # Build + run iOS
npm run android        # Build + run Android
npm run typecheck      # TypeScript check
npm run clear-cache    # Clear Metro cache
```

## Security Considerations

- Never commit `.env` files
- Use SecureStorage for sensitive data
- Validate all inputs with Zod schemas
- Use biometric auth for sensitive actions

## Migration Notes (Web to Mobile)

When porting from MindEase Web:
1. Replace DOM APIs with React Native equivalents
2. Use `react-native-reanimated` instead of Framer Motion
3. Replace `localStorage` with `zustandSecureStorage`
4. Replace `crypto.randomUUID()` with `expo-crypto` or uuid library
5. Replace Audio API with `expo-av`
6. Replace CSS with StyleSheet + theme tokens
