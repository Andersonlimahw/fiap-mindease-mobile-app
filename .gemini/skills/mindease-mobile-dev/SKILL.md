---
name: mindease-mobile-dev
description: Use this skill when you are developing or migrating features for the MindEase React Native Mobile application. This skill provides structural blueprints, architectural patterns, conventions, and configuration details unique to this Clean Architecture + MVVM repository. Trigger this when making architectural decisions or writing new features to ensure strict adherence to MindEase standards.
---

# MindEase Mobile Dev Skill

This skill contains the structural blueprints and patterns to be used when extending or modifying the MindEase Mobile React Native project.

## Core Mandates

1. **Strict Clean Architecture**: The app strictly follows Domain > Data > Core > Application > Presentation structure. No layer skipping is permitted.
2. **Never Use Expo Go**: Always develop targeting `prebuild` with native builds (`npm run ios` / `npm run android`).
3. **Zustand State**: All global state must use Zustand following our established patterns with atomic selectors.
4. **Dependency Injection**: Use the project's lightweight DI container for repositories.

## Architecture & Layers Reference

To understand how features are structured and implemented across layers, see **[references/architecture.md](references/architecture.md)**.
This reference includes detailed templates for:
- Domain Entities
- Repositories (Interfaces & Mock/Firebase Impls)
- Application Use Cases
- Zustand Stores
- UI Components & Screens

## Quick Setup and Commands

```bash
npm install
npm run start          # Start Metro
npm run ios            # Build + run iOS
npm run android        # Build + run Android
npm run typecheck      # TypeScript check
```

## Security Standards

- Never commit `.env` files.
- Use `zustandSecureStorage` (from `@app/infrastructure/storage/SecureStorage`) for persistent data.
- Validate all user inputs and domain entities with Zod schemas.
- Use `expo-crypto` for UUID generation.

## Migration (Web -> Mobile)

When porting a feature from the MindEase Web App (`.tmp/fiap-mindease-frontend-web/`):
- Replace DOM APIs with React Native equivalents.
- Replace `framer-motion` with `react-native-reanimated`.
- Replace HTML5 Audio with `expo-av`.
- Use the existing theme system `const theme = useTheme()` for all styling instead of CSS.
- Ensure i18n keys are correctly ported using `const { t } = useI18n()`.
