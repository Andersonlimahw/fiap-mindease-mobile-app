# ByteBank App - Quick Reference Guide

## Project Overview

**Type:** React Native (Expo SDK 54) + Firebase
**Architecture:** Clean Architecture + MVVM
**State Management:** Zustand with AsyncStorage persistence
**Language:** TypeScript 5.4.0
**Team:** FIAP Group 30

---

## Quick Facts

| Aspect | Details |
|--------|---------|
| **Framework** | React Native 0.81.4 |
| **Build System** | Expo with EAS |
| **State Management** | Zustand (3 stores) |
| **Backend** | Firebase (Firestore, Auth, Storage) |
| **Authentication** | Google Sign-In + Apple Sign-In |
| **Code Files** | 113 TypeScript/TSX files |
| **Screens** | 11 main screens |
| **Languages** | Portuguese, English, Spanish |
| **Themes** | ByteBank, HelioBank (dark/light) |

---

## Architecture Layers

```
PRESENTATION (UI Layer)
  ↓ Views, Screens, Components, Navigation
VIEWMODEL (Logic Hooks)
  ↓ useHomeViewModel, useExtractViewModel, etc.
STATE MANAGEMENT (Zustand)
  ↓ authStore, themeStore, diStore
APPLICATION (Use Cases)
  ↓ GetBalance, SignOut, GetRecentTransactions
DOMAIN (Business Logic)
  ↓ Entities: User, Transaction, Card, Pix, Investment
DATA (Repository Implementations)
  ↓ Firebase, Mock, Google Auth, B3 API, Currency API
```

---

## State Management

### Three Zustand Stores

#### 1. Auth Store (`src/store/authStore.ts`)
```typescript
// State
user: User | null              // Logged-in user
loading: boolean               // Auth operation in progress
isHydrated: boolean            // Store loaded from storage

// Actions
signIn(provider, options)      // Sign in with provider
signUp(email, password)        // Register
signOut()                      // Logout
signInAnonymously()            // Guest access

// Persistence
AsyncStorage key: "@bytebank-app/auth:v2"
Version: 2 (with migrations)
```

#### 2. Theme Store (`src/store/themeStore.ts`)
```typescript
// State
brand: 'bytebank' | 'heliobank'
mode: 'light' | 'dark'

// Actions
setBrand(brand)                // Switch brand
setMode(mode)                  // Toggle theme
toggleMode()                   // Light ↔ Dark

// Persistence
AsyncStorage key: "bb_theme"
Dynamic theme generation from brand palettes
```

#### 3. DI Store (`src/store/diStore.ts`)
```typescript
// State
container: Container           // DI container instance
di: DI                          // DI resolver

// Features
Auto-fallback to mocks if Firebase unavailable
Firebase initialization with error handling
```

---

## Repository Pattern

### Dual Implementation

Each domain has two implementations:

```
AuthRepository
├── GoogleAuthRepository    (Production - Google Sign-In)
└── MockAuthRepository      (Development - Mock data)

TransactionRepository
├── FirebaseTransactionRepository    (Firestore)
└── MockTransactionRepository        (In-memory)

[Similar for: Cards, Pix, Investments, Currency, Quotes, Files]
```

### Switching Strategy

```typescript
// In diStore.ts
if (AppConfig.useMock) {
  // Use mock implementations
  container.set(TOKENS.AuthRepository, new MockAuthRepository());
} else {
  // Use Firebase implementations
  container.set(TOKENS.AuthRepository, new GoogleAuthRepository());
}
```

---

## Firebase Collections

| Collection | Fields | Purpose |
|-----------|--------|---------|
| `transactions` | userId, type, amount, description, category, createdAt | User transactions |
| `cards` | userId, cardNumber, expiry, cvv, holderName, createdAt | Digital cards |
| `pixKeys` | userId, type, value, active, createdAt | PIX key registry |
| `pixTransfers` | userId, toKey, amount, status, method, createdAt | PIX history |
| `pixFavorites` | userId, alias, keyValue, name, createdAt | Saved recipients |
| `pixLimits` | userId, dailyLimit, nightlyLimit, perTransferLimit | PIX limits |
| `pixQrCharges` | userId, amount, status, payload, createdAt | QR charges |
| `investments` | userId, ticker, quantity, price, createdAt | Stock portfolio |
| `files` | userId, filename, path, metadata, createdAt | User documents |

---

## Key Features

### Authentication
- Google Sign-In (OAuth 2.0)
- Apple Sign-In (iOS)
- Anonymous Login
- Firebase automatic persistence

### Transactions
- Real-time updates via Firebase
- Add, Edit, Delete operations
- Balance calculation
- Search & filtering
- Category inference

### Cards
- Digital card display
- Flip animation (front/back)
- Luhn validation
- Card management

### PIX System
- Key registration (CPF, Email, Phone, Random)
- PIX transfers with validation
- QR code generation & payment
- Transfer limits enforcement
- Favorites & history

### Dashboard
- Income/Expense summary
- Spending by category (chart)
- Recent transactions
- Card carousel
- Quick actions

### Customization
- Dark/Light theme
- Brand switching (ByteBank/HelioBank)
- 3 languages (PT/EN/ES)
- Persistent preferences

---

## Component Structure

### Screen Components (11)
```
src/presentation/screens/
├── Home/           - Balance, recent transactions
├── Dashboard/      - Summary, spending chart
├── Extract/        - Transaction history
├── Investments/    - Stock portfolio
├── Cards/          - Digital cards
├── Pix/            - PIX transfers
├── User/           - User profile, settings
├── Transactions/   - Add transaction
├── Auth/           - Login, Register, Onboarding
└── [Others]
```

### Reusable Components
```
src/presentation/components/
├── TransactionItem          - Transaction list item
├── CardVisual               - Digital card display
├── QuickAction              - Action button
├── Avatar                   - User avatar
├── SwipeableRow             - Swipe actions
├── EmptyStateBanner         - Empty state UI
├── FileUploader             - File picker
├── HorizontalBarChart       - Spending chart
└── [Others]
```

### Custom Hooks
```
src/presentation/hooks/
├── animations.ts            - Fade/Slide/Pulse animations
```

### ViewModels (Custom Hooks)
```
src/presentation/viewmodels/
├── useAuthViewModel.ts               - Auth logic
├── useHomeViewModel.ts               - Home screen
├── useExtractViewModel.ts            - Transactions list
├── useDashboardViewModel.ts          - Dashboard
├── useInvestmentsViewModel.ts        - Investments
├── useCurrencyQuoteViewModel.ts      - Currency
├── useDigitalCardsViewModel.ts       - Cards
├── useFileViewModel.ts               - File uploads
└── usePixViewModel.ts                - PIX operations
```

---

## Performance Optimizations

### Currently Implemented
- ✓ useMemo() for style objects
- ✓ useCallback() for stable references
- ✓ Firebase onSnapshot() (real-time vs polling)
- ✓ React Native Screens (native optimization)
- ✓ Layout Animation on Android
- ✓ Dynamic imports for screens
- ✓ AsyncStorage caching

### Missing
- ✗ API response caching (B3 quotes)
- ✗ Image optimization (expo-image)
- ✗ Code splitting (React.lazy)
- ✗ Bundle size monitoring
- ✗ Hermes engine

---

## Security Issues

### CRITICAL
1. **B3 API Token Exposed**
   - Token: `p6j38bVSefgui6rCkjcCpT`
   - Location: `src/data/b3/B3QuoteRepository.ts`
   - Fix: Move to backend proxy or env variable

2. **Weak Input Validation**
   - Card: Only Luhn algorithm
   - PIX: Basic regex only
   - Fix: Add comprehensive sanitization

### HIGH
3. **No Biometric Auth**
   - Missing fingerprint/face ID
   - Fix: `react-native-biometrics`

### MEDIUM
4. **Unencrypted AsyncStorage**
   - Non-critical data only
   - Fix: `@react-native-secure-storage` for tokens

5. **No Certificate Pinning**
   - Custom APIs lack pinning
   - Fix: Implement cert pinning

---

## Environment Setup

### Installation
```bash
npm install
npx expo install
```

### Mock Mode (Default)
```bash
npm run start
npm run ios    # or npm run android
```

### Firebase Mode
```bash
# Set environment variables in .env
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

npm run start:firebase
```

### Build Commands
```bash
npm run ios:clean        # Full iOS rebuild
npm run android:clean    # Full Android rebuild
npm run typecheck        # TypeScript validation
npm run build            # TypeScript compilation
```

---

## Testing Status

| Type | Status | Coverage |
|------|--------|----------|
| Unit Tests | ✗ None | 0% |
| Integration Tests | ✗ None | 0% |
| E2E Tests | ✗ None | 0% |
| Type Checking | ✓ Enabled | 100% |

### Recommendations
- Jest + React Native Testing Library
- Test ViewModels with mock repositories
- Detox/Maestro for E2E

---

## Common Issues & Solutions

### Issue: "Firebase initialization failed"
**Solution:** 
- Check `.env` variables are set
- Firebase config in `GoogleService-Info.plist` (iOS)
- Firebase config in `google-services.json` (Android)

### Issue: "Cannot find module" errors
**Solution:**
```bash
npm run clean          # Full clean
npm install
npx expo install
npx expo prebuild --clean
```

### Issue: Card validation failing
**Solution:**
- Check Luhn algorithm
- CVV must be 3-4 digits
- Expiry format: MM/YY

### Issue: PIX transfer rejected
**Solution:**
- Check transfer limits
- Verify PIX key format
- Check daily/nightly window (22:00-06:00)

---

## Quick Wins (For Tech Challenge)

### High Priority (1-2 days)
1. Move B3 API token to backend proxy
2. Add input validation on all forms
3. Implement API response caching (5-min TTL)
4. Add error boundary component

### Medium Priority (3-5 days)
1. Set up Jest testing
2. Add Firebase Crashlytics
3. Implement biometric auth
4. Optimize banner images

### Lower Priority (1-2 weeks)
1. Add E2E tests with Detox
2. Implement offline support with WatermelonDB
3. Enable Hermes engine
4. Add bundle size monitoring

---

## Useful Files

### Configuration
- `app.json` - Expo app config
- `.env` - Environment variables
- `src/config/appConfig.ts` - App configuration
- `tsconfig.json` - TypeScript config

### Architecture
- `src/core/di/container.tsx` - DI setup
- `src/domain/` - Domain entities
- `src/application/` - Use cases
- `src/data/` - Repository implementations

### State Management
- `src/store/authStore.ts` - Auth state
- `src/store/themeStore.ts` - Theme state
- `src/store/diStore.ts` - DI container

### Navigation
- `src/presentation/navigation/RootNavigator.tsx` - Main navigator
- `App.tsx` - App entry point

### Documentation
- `README.md` - Setup & features
- `docs/` - Architecture docs
- `docs/digrams/` - Flow diagrams

---

## Key Dependencies

```json
{
  "react": "19.1.0",
  "react-native": "0.81.4",
  "expo": "54.0.0",
  "zustand": "4.5.2",
  "@react-native-firebase/*": "23.3.1",
  "@react-navigation/*": "6.x",
  "typescript": "5.4.0"
}
```

---

## Metrics

- **Total Files:** 113 TypeScript/TSX
- **Screens:** 11
- **Components:** 10+
- **ViewModels:** 8
- **Repositories:** 8+ types
- **Firebase Collections:** 9
- **Stores:** 3
- **Languages:** 3

---

## Grade & Assessment

**Overall Grade: B+ (85/100)**

**Strengths:**
- Excellent architecture (Clean + MVVM)
- Full TypeScript coverage
- Comprehensive features
- Good code organization
- Professional development practices

**Weaknesses:**
- Security gaps (API token, validation)
- Performance optimization (caching, images)
- No testing infrastructure
- No error tracking/monitoring
- Limited offline support

**Tech Challenge Readiness:** 7/10
- Ready for submission with security/performance improvements
- Demonstrates professional architectural maturity
- Minor hardening needed

---

## Team Resources

- **Group:** FIAP Group 30
- **Members:** 5
- **Repository:** This project
- **Documentation:** /docs folder
- **Releases:** /releases folder

---

**Report Generated:** October 22, 2025
**Analysis Depth:** Very Thorough (comprehensive code review)
