# Firebase Integration Guide - MindEase Mobile

## Overview

O MindEase Mobile utiliza Firebase Firestore para persistência de dados em tempo real. A implementação segue a arquitetura Clean Architecture com Repository Pattern para facilitar testes e manutenção.

## Integrations Implemented ✅

### 1. Authentication (Google Sign-In)
**Location**: `src/data/google/GoogleAuthRepository.ts`
- Google Sign-In via credenciais nativas (iOS/Android)
- Sem uso do firebase/auth (utiliza GoogleSignin lib)
- Fallback para autenticação anônima

### 2. Files Storage
**Location**: `src/data/firebase/FirebaseFileRepository.ts`
- Upload/download de arquivos para Firebase Storage
- Organização por usuário: `mindease-files/users/{userId}/records/{transaction}`
- Suporte a múltiplos tipos de arquivo (img, áudio, etc.)

### 3. Tasks Management
**Location**: `src/data/firebase/FirebaseTaskRepository.ts`
- CRUD completo para tarefas
- Subtarefas aninhadas
- Inscrições em tempo real
- Timestamps de conclusão

### 4. Chat Messages (NEW)
**Location**: `src/data/firebase/FirebaseChatRepository.ts`
- Histórico de chat persistido
- Inscrições em tempo real
- Suporte a múltiplos usuários
- Respostas demo como fallback

## Firestore Collections Schema

### `tasks`
```json
{
  "userId": "string",
  "title": "string",
  "description": "string",
  "priority": "low|medium|high",
  "completed": "boolean",
  "subTasks": [
    {
      "id": "string",
      "title": "string",
      "completed": "boolean"
    }
  ],
  "createdAt": "timestamp",
  "completedAt": "timestamp (optional)"
}
```

**Índices necessários**:
```
Collection: tasks
- Field: userId (Asc), createdAt (Desc)
```

### `files`
```json
{
  "userId": "string",
  "fileName": "string",
  "fileUrl": "string",
  "mimeType": "string",
  "size": "number",
  "uploadedAt": "timestamp"
}
```

### `chatMessages` (NEW)
```json
{
  "userId": "string",
  "role": "user|assistant",
  "content": "string",
  "timestamp": "timestamp"
}
```

**Índices necessários**:
```
Collection: chatMessages
- Field: userId (Asc), timestamp (Asc)
```

## Repository Pattern Implementation

Cada repositório segue este padrão:

```typescript
// Interface (Domain)
export interface TaskRepository {
  getAll(userId: string): Promise<Task[]>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, input: UpdateTaskInput): Promise<Task>;
  delete(id: string): Promise<void>;
  subscribe(userId: string, callback: (tasks: Task[]) => void): () => void;
}

// Mock Implementation (Data - Mock)
export class MockTaskRepository implements TaskRepository {
  // In-memory implementation for testing
}

// Firebase Implementation (Data - Firebase)
export class FirebaseTaskRepository implements TaskRepository {
  // Firebase Firestore implementation
}
```

## DI Container Setup

Todas as implementações são registradas via DI Container:

```typescript
// src/store/diStore.ts
function buildContainer(): Container {
  const container = new Container();

  if (AppConfig.useMock) {
    // Use mock implementations
    container.set(TOKENS.TaskRepository, MockTaskRepository);
    container.set(TOKENS.ChatRepository, new MockChatRepository());
  } else {
    // Use Firebase implementations
    FirebaseAPI.ensureFirebase();
    container.set(TOKENS.TaskRepository, new FirebaseTaskRepository());
    container.set(TOKENS.ChatRepository, new FirebaseChatRepository());
  }

  return container;
}
```

## Running in Different Modes

### Mock Mode (Default)
```bash
# All data in-memory, no Firebase
npm run ios
npm run android
```

### Firebase Mode
```bash
# Requires configured .env with Firebase credentials
EXPO_PUBLIC_USE_MOCK=false npm run ios
EXPO_PUBLIC_USE_MOCK=false npm run android
```

### Ollama Mode (Chat only)
```bash
# Chat uses Ollama API, other data in mock
EXPO_PUBLIC_OLLAMA_URL=http://localhost:11434 npm run ios
```

## Environment Configuration

### Required for Firebase Mode
```env
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
```

### Optional
```env
EXPO_PUBLIC_BRAND=mindease|neon
EXPO_PUBLIC_THEME_MODE=light|dark
EXPO_PUBLIC_OLLAMA_URL=http://localhost:11434
```

## Real-time Subscriptions

Firebase repositories use `onSnapshot` para atualizações em tempo real:

```typescript
const unsub = taskRepository.subscribe(userId, (tasks: Task[]) => {
  set({ tasks }); // Update Zustand store
});

// Cleanup
useEffect(() => {
  const unsub = taskRepository.subscribe(userId, callback);
  return unsub; // Unsubscribe on unmount
}, [userId]);
```

## Error Handling

Implementações Firebase incluem tratamento robusto:

```typescript
try {
  const result = await repository.operation();
} catch (error) {
  console.error('[ChatRepository]', error);
  // Fallback to mock response or demo data
}
```

## Performance Considerations

1. **Pagination**: Usar `limit()` e `startAfter()` para grandes datasets
2. **Lazy Loading**: Carregar dados sob demanda
3. **Caching**: Usar CacheManager para dados frequentes
4. **Batch Operations**: Agrupar writes com batch()

```typescript
// Example: Batch delete
async batchDelete(ids: string[]): Promise<void> {
  const batch = writeBatch(this.getDb());
  ids.forEach((id) => {
    batch.delete(doc(this.getDb(), COLLECTION_NAME, id));
  });
  await batch.commit();
}
```

## Security Rules (Firebase Console)

Exemplo para collections com userId:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tasks - user owns their data
    match /tasks/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }

    // Chat Messages - user owns their data
    match /chatMessages/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Testing with Mock Repository

Todos os testes usam MockRepository por padrão:

```typescript
// src/store/__tests__/tasksStore.test.ts
describe('Tasks Store', () => {
  it('should fetch tasks', async () => {
    const { useTasksStore } = setupMocks();
    await useTasksStore.getState().fetchTasks('user-123');
    expect(useTasksStore.getState().tasks).toHaveLength(1);
  });
});
```

## Debugging Firebase Calls

Enable verbose Firebase logging:

```typescript
// App.tsx
if (__DEV__) {
  // Firebase logging
  console.log('[Firebase] Initialized');
}
```

## Common Issues

### Issue: "FirebaseError: missing or insufficient permissions"
**Solution**: Verificar Security Rules no Firebase Console. Usuário deve estar autenticado.

### Issue: "Reference to undefined collection"
**Solution**: Criar índices compostos no Firebase Console se consultas falham.

### Issue: "Transaction aborted - too much contention"
**Solution**: Reduzir taxa de escritas simultâneas. Implementar retry com backoff exponencial.

## References

- Firebase Realtime Updates: https://firebase.google.com/docs/firestore/query-data/listen
- React Native Firebase: https://rnfirebase.io/
- Expo + Firebase: https://docs.expo.dev/guides/firebase/
- Clean Architecture: https://blog.cleancoder.com/

