# MindEase - Productivity & Wellness App (Expo + React Native)

- **IMPORTANT! Never run with expo GO, use prebuild and native options**

## Overview

- Expo + React Native + TypeScript
- MVVM + Clean Architecture + SOLID-oriented boundaries (lightweight DI)
- Auth repository with anonymous login (mock by default)
- Mock mode is available; default mode follows your scripts/env
- Features: Login, Home (dashboard), Tasks, Pomodoro Timer, Focus Mode, AI Chat, Accessibility
- Shared theme tokens for consistent colors, spacing, and typography
- Whitelabel themes: runtime brand + theme switch (logo, colors, fonts)

## Project Structure

- app.json: Expo app configuration
- App.tsx: Entrypoint with providers + navigation
- src/config: Env config (Firebase + flags)
- src/core/di: Minimal DI container + tokens
- src/domain: Entities and repository interfaces
- src/application: Use cases (business rules)
- src/data/firebase: Firebase repository implementations
- src/data/mock: Mock repository implementations (default)
- src/infrastructure/firebase: Firebase initialization + providers
- src/presentation: Screens, navigation, providers, components
  - presentation/theme: App theme (colors, spacing, radius)
- src/utils: Format helpers

## Getting Started

1. Prerequisites

   - Node.js LTS
   - Expo CLI: npx expo@latest --version

2. Install dependencies

   - npm install
   - or: pnpm i / yarn

3. Run the native app
   - **IMPORTANT! Never run with expo GO, use prebuild and native options**
   - Start Metro with the dev client: `npm run start`.
   - In another terminal, build and launch a native dev client via `npm run ios` or `npm run android`.
   - ** IMPORTANT! Never run with expo GO **
   - Alternatively, run `npx expo prebuild` once and then `npx expo run:ios` / `npx expo run:android`.
   - We ship native modules for authentication (Google/Apple) and Firebase, so running through Expo Go alone is not supported.
   - If Firebase envs are present (`EXPO_PUBLIC_FIREBASE_API_KEY`, `PROJECT_ID`, `APP_ID`), the app runs in real mode; otherwise, it falls back to mock mode.
   - Force real (Firebase) mode: set `EXPO_PUBLIC_USE_MOCK=false` in `.env` before running `npm run start`.
   - Force mock mode: set `EXPO_PUBLIC_USE_MOCK=true` in `.env` before running `npm run start`.

## Whitelabel Themes

- Runtime switching:
  - Go to `Minha Conta` (User) screen → Aparência.
  - Toggle `Tema` (Claro/Escuro) or select `Marca`.
  - Changes update app-wide instantly (navigation, components, screens).
- Persisted preferences:
  - Selected `brand` and `mode` persist via AsyncStorage (`bb_theme`).
- Default via env (optional):
  - `EXPO_PUBLIC_BRAND=mindease |heliobank`
  - `EXPO_PUBLIC_THEME_MODE=light|dark` (alias: `THEME_MODE`)
  - Set in `.env` — see `.env.example` — and start the app.
- Brand assets:
  - Static logos are mapped in `src/presentation/theme/brandAssets.ts`.
  - If a brand has no image, the UI falls back to the text logo defined by the brand (`theme.logoText`).
  - Add your assets and map `{ light, dark }` entries per brand.

## Troubleshooting

- PlatformConstants not found: This usually means a native/JS version mismatch or duplicate native modules.
  - Avoid mismatched dependencies in managed Expo apps:
    - Do not pin `react-native` directly; let Expo manage it.
    - Keep `react` on 18.x for SDK 54 (React 19 is not supported).
    - Run `npx expo install` to align versions for your SDK.
    - If you had pinned older versions, remove them and reinstall dependencies.
  - Reinstall deps and clear caches:
    - `rm -rf node_modules package-lock.json` then `npm i`
    - `npm run clear-cache` (runs `expo start --clear`)
  - If you prebuilt native projects before, run `npx expo prebuild --clean` and rebuild the app.
  - Ensure your Expo SDK and Expo Go app are up-to-date (this project targets SDK 54 / RN 0.75).

## Current Status

- Mock repositories wired via DI, with automatic fallback if Firebase is misconfigured
- Auth flow (Google/Apple/Email/Anonymous) + guarded navigation
- Task management with subtasks, priorities, and progress tracking
- Pomodoro timer with configurable focus/break sessions and statistics
- Focus Mode with ambient sounds (rain, forest, ocean, cafe, white noise)
- AI Chat assistant with productivity tips and quick questions
- Accessibility settings (font size, high contrast, color blind modes, reduce motion)

---

## Tech Challenge Fase 04 - Melhorias Implementadas

### Segurança

| Melhoria | Descrição | Arquivos |
|----------|-----------|----------|
| **API tokens protegidos** | Tokens movidos para variáveis de ambiente, removidos do código fonte | `src/config/appConfig.ts` |
| **Validação robusta com Zod** | Validação type-safe de inputs de tarefas, configurações e formulários | `src/domain/validation/schemas.ts` |
| **Criptografia de dados** | MMKV com encryption + expo-secure-store para credenciais | `src/infrastructure/storage/SecureStorage.ts` |
| **Autenticação biométrica** | Face ID / Impressão Digital para ações sensíveis | `src/presentation/hooks/useBiometricAuth.ts`, `src/presentation/components/BiometricLock.tsx` |

### Performance

| Melhoria | Descrição | Arquivos |
|----------|-----------|----------|
| **Cache de requisições API** | Cache com TTL e estratégias (Cache-First, Network-First, Stale-While-Revalidate) | `src/infrastructure/cache/CacheManager.ts` |
| **Lazy loading de telas** | React.lazy + Suspense para carregar telas sob demanda | `src/presentation/navigation/RootNavigator.tsx` |
| **FlashList** | Substituição de FlatList por FlashList para listas de alta performance | `src/presentation/screens/Tasks/TasksScreen.tsx` |
| **Otimização de imagens** | expo-image com cache em disco/memória, lazy loading, placeholders | `src/presentation/components/OptimizedImage.tsx` |
| **Debounce em inputs** | Debounce de 300ms em campos de busca | `src/presentation/hooks/useDebounce.ts` |
| **Selectors Zustand otimizados** | Selectors individuais para evitar re-renders desnecessários | `src/store/authStore.ts` |

### Programação Reativa

| Melhoria | Descrição | Arquivos |
|----------|-----------|----------|
| **Firebase subscription hooks** | Gerenciamento automático de subscriptions com cleanup | `src/presentation/hooks/useFirebaseSubscription.ts` |
| **Debounce/Throttle hooks** | Hooks reutilizáveis para controle de frequência | `src/presentation/hooks/useDebounce.ts` |

### Novas Dependências Adicionadas

```json
{
  "zod": "^3.x",
  "react-native-mmkv": "^2.x",
  "expo-secure-store": "~14.x",
  "expo-local-authentication": "~15.x",
  "expo-image": "~2.x",
  "@shopify/flash-list": "^1.x"
}
```

### Configuração de Variáveis de Ambiente

Adicione ao seu arquivo `.env`:

```bash
# API tokens (if applicable)
# EXPO_PUBLIC_API_TOKEN=your_token_here
```

### Arquitetura de Segurança

```
┌─────────────────────────────────────────────────────────────┐
│                        PRESENTATION                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ BiometricLock│  │   Screens   │  │    Components       │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │              │
│         ▼                ▼                     ▼              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              VALIDATION (Zod Schemas)                  │  │
│  │  - CPF/CNPJ  - Email  - Phone  - PIX Keys  - Amount   │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE                          │
│  ┌───────────────────────┐  ┌───────────────────────────┐   │
│  │    SecureStorage       │  │      CacheManager         │   │
│  │  ┌─────────────────┐  │  │  ┌─────────────────────┐  │   │
│  │  │  MMKV (encrypt) │  │  │  │  Memory + Disk      │  │   │
│  │  └─────────────────┘  │  │  └─────────────────────┘  │   │
│  │  ┌─────────────────┐  │  │  - TTL                    │   │
│  │  │  SecureStore    │  │  │  - Stale-While-Revalidate│   │
│  │  │  (Keychain)     │  │  │  - Dedup requests        │   │
│  │  └─────────────────┘  │  └───────────────────────────┘   │
│  └───────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Switching to Firebase

1. Create a Firebase project and a web app to obtain config.
2. Set the following environment variables (Expo public envs):

   - EXPO_PUBLIC_USE_MOCK=false (optional; omit to auto-detect based on Firebase envs)
   - EXPO_PUBLIC_FIREBASE_API_KEY=...
   - EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   - EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   - EXPO_PUBLIC_FIREBASE_APP_ID=...
   - EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   - EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
     You can copy .env.example to .env and edit.

3. Google/Apple providers (native)

   - Google Sign-In uses expo-auth-session. Set one of:
     - EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID (works on Expo Go), or
     - Platform-specific: EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / ANDROID / WEB.
   - Redirect handling: app.json includes `"scheme": "mindease "` and the code uses `makeRedirectUri({ scheme: 'mindease ', useProxy: true })` on native for easy dev. For production builds, AuthSession will use your app scheme.
   - Apple Sign-In works only on iOS. Ensure your Apple capabilities are configured for your Bundle ID.

4. Install required packages if not present

- npx expo install expo-auth-session expo-apple-authentication expo-web-browser
- npm i firebase @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
- npx expo install react-native-screens react-native-safe-area-context
- Note: `app.json` includes the `expo-apple-authentication` plugin required for native iOS builds.

5. Providers (native)

   - Google/Apple on native use Expo AuthSession and pass credentials to Firebase.
   - Web uses Firebase popup providers.

6. Run with Firebase

- npm run start
- Ensure .env is loaded (Expo reads EXPO*PUBLIC*\* automatically)
- In `app.json`, update iOS bundle identifier and Android package if needed.

Auth Persistence on Native

- The app attempts to use React Native persistence for Firebase Auth when running on iOS/Android via `initializeAuth(..., getReactNativePersistence(AsyncStorage))`.
- If `@react-native-async-storage/async-storage` isn’t installed, it falls back to in-memory persistence (sign-in still works during the session but won’t persist across restarts).
- To enable full persistence, install AsyncStorage:
  - npx expo install @react-native-async-storage/async-storage
  - Then rebuild if using prebuild/EAS.

## Tasks (Firestore)

- Collection: `tasks` with fields: `userId` (string), `title` (string), `description` (string), `priority` ('low'|'medium'|'high'), `completed` (boolean), `subTasks` (array), `createdAt` (serverTimestamp)
- Queries order by `createdAt desc` filtered by `userId` (you may be prompted by Firebase to create a composite index)
- Real-time: the app subscribes to the tasks query, updating the Tasks screen live

## Pomodoro & Focus Sessions (Firestore)

- Collection: `pomodoroSessions` with fields: `userId` (string), `mode` (string), `duration` (number), `completedAt` (serverTimestamp)
- Collection: `focusSessions` with fields: `userId` (string), `duration` (number), `actualDuration` (number), `ambientSound` (string), `startedAt` (serverTimestamp)

Data Standardization Notes

- Firestore transactions use `createdAt` stored as `serverTimestamp()`; readers map Firestore `Timestamp` to epoch milliseconds to match domain model.
- ViewModels now use application usecases (`GetTasks`, `GetPomodoroStats`, `SignInWithProvider`, `SignOut`) to keep layers consistent with Clean Architecture.
- UI uses centralized theme tokens in `src/presentation/theme/theme.ts` to standardize colors (primary, success, danger, text, muted, border), spacing, and radius.

Firebase Initialization (Real Mode)

- When `EXPO_PUBLIC_USE_MOCK=false`, Firebase is initialized early during DI container setup via `FirebaseAPI.ensureFirebase()`. This fails fast if any required Firebase env vars are missing, helping catch config issues on startup.

## Notes

- Assets are referenced from the repo’s contents/figma folder to reflect designs without duplicating files.
- Mock mode seeds demo tasks and a sample user so you can navigate immediately.
- For production, replace the placeholder EAS projectId in app.json and configure app icons, splash, and bundle ids.

## Scripts

- start: Launch Metro bundler
- android / ios: Build and run a dev prebuild (requires native toolchains)
- typecheck: TypeScript validation without emitting


## Indexes

- Firestore may prompt you to create indexes for queries combining `where('userId','==',...)` and `orderBy('createdAt','desc')` on the collections above. Create the suggested index in the Firebase console if requested.

## Architeture

[Live version on excalidraw](https://link.excalidraw.com/l/7XRBb57RGJp/5UGCXbSooLk)
[Local version](/docs/index.md)

## Releases

Read the documentation in this file and install the application in its latest version, without having to run the project.
[Release notes and installable .apk files](/releases/index.md)


## 👥 Members Group 30

> Alexsander de Almeida Perusso  
> alexperusso@gmail.com  
> RM364149

---

> Anderson Santos De Lima  
> andersonlimahw@gmail.com  
> RM363575

---

> Bruna Barreto Ribeiro  
> bru.barretoribeiro@gmail.com  
> RM362095

---

> Herbert Rezende Ferreira  
> hrezendeferreira@gmail.com  
> RM363976

---

> Thyago do Nascimento Pereira  
> thyagopereira41@gmail.com
> RM362540


