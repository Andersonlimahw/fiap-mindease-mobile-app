# Arquitetura Híbrida de IA — MindEase Mobile

Sistema de IA com múltiplos backends, fallback automático e streaming de respostas.

---

## Visão Geral

```
ChatScreen → chatStore → DI Container → RepositorySelector → [Torch | Ollama | Firebase | Demo]
```

O `RepositorySelector` encapsula a lógica de fallback e é transparente para a UI — o store enxerga apenas um `ChatRepository` unificado.

---

## Diagrama de Classes

```mermaid
classDiagram
    class ChatRepository {
        <<interface>>
        +sendMessage(userId, messages, systemPrompt, onChunk?) ChatResponse
        +getMessages(userId) ChatMessage[]
        +subscribe(userId, callback) () => void
        +deleteMessage(id) void
        +clearMessages(userId) void
    }

    class RepositorySelector {
        -repositories Map~AIResponseSource, ChatRepository~
        -stats Map~AIResponseSource, RepositoryStats~
        -responseCache Map~string, CachedResponse~
        -maxCacheSize 100
        -cacheValidityMs 3600000
        +sendMessage(userId, messages, systemPrompt, onChunk?) ResponseWithMetadata
        -getRepositoryOrder() AIResponseSource[]
        -recordSuccess(source, latencyMs) void
        -recordFailure(source, error, latencyMs) void
        -getFromCache(key) CachedResponse | null
        -addToCache(key, response) void
        +getStats() RepositoryStats[]
        +getAttempts() RepositoryAttempt[]
        +clearCache() void
    }

    class TorchChatRepository {
        +sendMessage(userId, messages, systemPrompt, onChunk?) ChatResponse
        +getMessages(userId) ChatMessage[]
    }

    class OllamaChatRepository {
        -OLLAMA_TIMEOUT_MS 30000
        +sendMessage(userId, messages, systemPrompt, onChunk?) ChatResponse
        +getMessages(userId) ChatMessage[]
        -streamViaXHR(url, body, onChunk) ChatResponse
    }

    class FirebaseChatRepository {
        +sendMessage(userId, messages, systemPrompt, onChunk?) ChatResponse
        +getMessages(userId) ChatMessage[]
        +subscribe(userId, callback) () => void
        +deleteMessage(id) void
        +clearMessages(userId) void
    }

    class MockChatRepository {
        +sendMessage(userId, messages, systemPrompt, onChunk?) ChatResponse
        +getMessages(userId) ChatMessage[]
    }

    ChatRepository <|.. TorchChatRepository
    ChatRepository <|.. OllamaChatRepository
    ChatRepository <|.. FirebaseChatRepository
    ChatRepository <|.. MockChatRepository
    RepositorySelector --> ChatRepository : usa

    class AIResponseMetadata {
        +source AIResponseSource
        +latencyMs number
        +cached boolean
        +model? string
        +timestamp number
    }

    class RepositoryStats {
        +source AIResponseSource
        +totalAttempts number
        +successCount number
        +failureCount number
        +averageLatencyMs number
        +successRate number
    }

    RepositorySelector --> AIResponseMetadata : retorna
    RepositorySelector --> RepositoryStats : rastreia
```

---

## Fluxo de Requisição (Sequence Diagram)

```mermaid
sequenceDiagram
    actor User
    participant ChatScreen
    participant chatStore
    participant wrappedRepo as ChatRepository (DI)
    participant Selector as RepositorySelector
    participant Ollama as OllamaChatRepository
    participant Firebase as FirebaseChatRepository
    participant Mock as MockChatRepository

    User->>ChatScreen: digita mensagem e envia

    ChatScreen->>chatStore: sendMessage(content)
    chatStore->>chatStore: cria userMessage + initialAssistantMessage (content: "")
    chatStore->>chatStore: set({ messages: [..., user, assistant], isLoading: true })

    chatStore->>wrappedRepo: sendMessage(userId, messages, systemPrompt, onChunk)
    wrappedRepo->>Selector: sendMessage(userId, messages, systemPrompt, onChunk)

    Selector->>Selector: getCacheKey(messages) → verificar cache
    alt cache válido (< 1h)
        Selector-->>chatStore: { response, metadata: { cached: true } }
    else cache miss
        Selector->>Selector: getRepositoryOrder() → [torch, ollama, firebase, demo]

        Note over Selector: Tenta repositório primário (ex: torch)
        Selector->>Selector: torch.sendMessage() → timeout/erro

        Note over Selector: Fallback → Ollama
        Selector->>Ollama: sendMessage(userId, messages, systemPrompt, onChunk)

        Note over Ollama: streaming via XMLHttpRequest
        loop NDJSON stream (readyState 3)
            Ollama->>Ollama: xhr.responseText.substring(processedLen)
            Ollama->>Ollama: split('\n') → JSON.parse cada linha
            Ollama-->>chatStore: onChunk(token)
            chatStore->>chatStore: atualiza messages[assistantId].content += token
            chatStore-->>ChatScreen: re-render (token a token)
        end

        Ollama-->>Selector: resolve({ content: fullContent })
        Selector->>Selector: recordSuccess(ollama, latencyMs)
        Selector->>Selector: addToCache(key, response)
        Selector-->>wrappedRepo: { response, metadata }
        wrappedRepo-->>chatStore: response

        chatStore->>chatStore: set({ messages[assistantId].content = finalContent, isLoading: false })
        chatStore-->>ChatScreen: re-render final
        ChatScreen-->>User: mensagem completa exibida
    end
```

---

## Fallback Chain (Flowchart)

```mermaid
flowchart TD
    Start([Usuário envia mensagem]) --> Cache{Cache válido?}

    Cache -->|Sim < 1h| CacheHit[Retorna do cache\nlatency: 0ms\nsource: local_cached]
    Cache -->|Não| Order[Determina ordem\npor AppConfig]

    Order --> Torch

    subgraph Fallback Chain
        Torch[1. TorchChatRepository\non-device · timeout 3s]
        Ollama[2. OllamaChatRepository\ndev server · timeout 30s]
        Firebase[3. FirebaseChatRepository\nnuvem · timeout 10s]
        Demo[4. MockChatRepository\nhardcoded · timeout 1s]

        Torch -->|sucesso| Done
        Torch -->|erro/timeout| Ollama
        Ollama -->|sucesso| Done
        Ollama -->|erro/timeout| Firebase
        Firebase -->|sucesso| Done
        Firebase -->|erro/timeout| Demo
        Demo --> Done
    end

    Done([Retorna com AIResponseMetadata]) --> UI

    subgraph UI
        direction LR
        StreamUpdate[Atualiza token a token\nonChunk callback]
        FinalSet[set isLoading: false\nconteúdo final fixado]
    end

    CacheHit --> FinalSet

    style Torch fill:#4ade80,color:#000
    style Ollama fill:#60a5fa,color:#000
    style Firebase fill:#fb923c,color:#000
    style Demo fill:#94a3b8,color:#000
    style CacheHit fill:#a78bfa,color:#000
```

---

## Streaming — OllamaChatRepository

O Ollama retorna NDJSON (um objeto JSON por linha), então não é possível usar `fetch` + `ReadableStream` no React Native. A solução usa `XMLHttpRequest` com leitura incremental do `responseText`:

```mermaid
sequenceDiagram
    participant Store as chatStore
    participant Ollama as OllamaChatRepository
    participant XHR as XMLHttpRequest
    participant Server as Ollama Server

    Store->>Ollama: sendMessage(..., onChunk)
    Ollama->>XHR: xhr.open(POST, /api/chat)
    XHR->>Server: { model, messages, stream: true }

    loop readyState === 3 (LOADING)
        Server-->>XHR: chunk NDJSON
        XHR->>Ollama: onreadystatechange
        Ollama->>Ollama: newData = responseText.substring(processedLen)
        Ollama->>Ollama: split('\n') → JSON.parse
        Ollama->>Ollama: fullContent += chunkObj.message.content
        Ollama-->>Store: onChunk(token)
        Store->>Store: messages[id].content += token
    end

    Server-->>XHR: readyState === 4 (DONE)
    XHR->>Ollama: onload (status 200)
    Ollama->>Ollama: clearTimeout(timeoutId)
    Ollama-->>Store: resolve({ content: fullContent })
```

---

## Wiring do DI Container

```mermaid
flowchart LR
    subgraph diStore ["diStore.ts — buildChatRepositoryWithSelector()"]
        Torch2[TorchChatRepository]
        Ollama2[OllamaChatRepository]
        Firebase2[FirebaseChatRepository]
        Mock2[MockChatRepository]

        Torch2 --> Selector2
        Ollama2 --> Selector2
        Firebase2 --> Selector2
        Mock2 --> Selector2

        Selector2[RepositorySelector] --> Wrapper

        Wrapper["wrappedRepo: ChatRepository\n(adapter que extrai .response de .metadata)"]
    end

    Wrapper -->|container.set\nTOKENS.ChatRepository| Container[DI Container]
    Container -->|di.resolve\nTOKENS.ChatRepository| chatStore

    chatStore --> ChatScreen

    note["getMessages / subscribe / delete\nroteados direto ao FirebaseChatRepository"]
    Wrapper -.-> note
```

---

## Persistência e Responsabilidades por Repositório

| Repositório | sendMessage | getMessages | subscribe | Streaming |
|---|---|---|---|---|
| **TorchChatRepository** | on-device inference | — | — | via onChunk |
| **OllamaChatRepository** | XHR → Ollama API | — (stateless) | no-op | ✅ XHR incremental |
| **FirebaseChatRepository** | Cloud Function | Firestore | Firestore realtime | não |
| **MockChatRepository** | resposta demo | [] | no-op | não |

Operações de leitura/escrita persistente (`getMessages`, `subscribe`, `deleteMessage`, `clearMessages`) são sempre roteadas ao `FirebaseChatRepository` pelo wrapper no `diStore`.

---

## Configuração por Ambiente

### Variáveis de ambiente

```bash
# Repositório primário (torch | ollama | firebase | mock)
EXPO_PUBLIC_AI_PRIMARY_REPOSITORY=ollama

# Torch (on-device)
EXPO_PUBLIC_AI_TORCH_ENABLED=true
EXPO_PUBLIC_AI_TORCH_MODEL=distilbert-base-multilingual-cased
EXPO_PUBLIC_AI_TORCH_MODEL_URL=https://models.example.com/model.pt

# Ollama (dev server)
EXPO_PUBLIC_AI_OLLAMA_URL=http://localhost:11434
EXPO_PUBLIC_AI_OLLAMA_MODEL=llama3
```

### Cadeia por ambiente

```mermaid
flowchart LR
    subgraph dev [Desenvolvimento]
        D1[Torch 3s] --> D2[Ollama 30s] --> D3[Firebase 10s] --> D4[Demo 1s]
    end
    subgraph prod [Produção]
        P1[Torch 3s] --> P2[Firebase 10s] --> P3[Demo 1s]
    end
    subgraph test [Testing / Demo]
        T1[Demo 1s]
    end
```

---

## Cache de Respostas

- **Chave**: últimos 100 chars da última mensagem do usuário (`msg:<content>`)
- **TTL**: 1 hora (`cacheValidityMs = 3_600_000`)
- **Tamanho máximo**: 100 entradas (LRU — remove a mais antiga)
- **Source na metadata**: `AIResponseSource.LOCAL_CACHED` com `latencyMs: 0`

---

## Monitoramento e Debug

```typescript
import { getRepositorySelector } from '@app/store/diStore';

// Stats acumulados por repositório
const selector = getRepositorySelector();
console.table(selector?.getStats());
// source     | total | success | avgLatency | successRate
// ollama     |   12  |   10    |   1800ms   |   0.83
// firebase   |    2  |    2    |   2100ms   |   1.00
// demo       |    0  |    0    |      0ms   |   0.00

// Histórico de tentativas
selector?.getAttempts().forEach(a =>
  console.log(`${a.source}: ${a.success ? '✅' : '❌'} ${a.latencyMs}ms`)
);
```

Seletor também exposto em `global.__aiRepositorySelector` para inspeção no Flipper/DevTools.

---

## Tipos Principais

```typescript
// src/types/ai.ts

enum AIResponseSource {
  LOCAL        = 'local',         // TorchChatRepository
  LOCAL_CACHED = 'local_cached',  // Cache interno
  OLLAMA       = 'ollama',        // OllamaChatRepository
  CLOUD        = 'cloud',         // FirebaseChatRepository
  DEMO         = 'demo',          // MockChatRepository
}

interface AIResponseMetadata {
  source: AIResponseSource;
  latencyMs: number;
  cached: boolean;
  model?: string;      // ex: 'llama3', 'distilbert-...'
  timestamp: number;
}

interface RepositoryStats {
  source: AIResponseSource;
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  averageLatencyMs: number;
  successRate: number; // 0–1
}
```

---

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `src/types/ai.ts` | Enums e interfaces do sistema de IA |
| `src/config/appConfig.ts` | Configuração de repositórios e timeouts |
| `src/core/ai/RepositorySelector.ts` | Orquestração de fallback e cache |
| `src/domain/repositories/ChatRepository.ts` | Contrato da interface |
| `src/domain/entities/ChatMessage.ts` | Entidades e respostas demo |
| `src/data/ollama/OllamaChatRepository.ts` | Streaming via XHR para Ollama |
| `src/data/torch/TorchChatRepository.ts` | Inferência on-device (em desenvolvimento) |
| `src/data/firebase/FirebaseChatRepository.ts` | Backend em nuvem |
| `src/data/mock/MockChatRepository.ts` | Fallback demo sempre disponível |
| `src/store/diStore.ts` | Wiring do DI e wrapper unificado |
| `src/store/chatStore.ts` | Estado do chat com streaming incremental |
| `src/presentation/screens/Chat/ChatScreen.tsx` | UI com typing indicator |
