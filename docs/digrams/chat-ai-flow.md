# Chat AI — Diagramas de Fluxo

Diagramas detalhados da arquitetura de IA do chat MindEase.

---

## 1. Fallback Chain

```mermaid
flowchart TD
    Start([Usuário envia mensagem]) --> Cache{Cache hit?}

    Cache -->|sim, < 1h| CacheReturn["Retorna resposta\nsource: local_cached\nlatency: 0ms"]
    Cache -->|não| Primary[Repositório primário\nconfigurável via .env]

    subgraph Chain [Cadeia de fallback — em ordem]
        Torch["🟢 TorchChatRepository\non-device · timeout 3s"]
        Ollama["🔵 OllamaChatRepository\nOllama API · timeout 30s"]
        Firebase["🟠 FirebaseChatRepository\nCloud Function · timeout 10s"]
        Demo["⚪ MockChatRepository\nrespostas demo · timeout 1s"]
    end

    Primary --> Torch
    Torch -->|sucesso| Success
    Torch -->|falhou| Ollama
    Ollama -->|sucesso| Success
    Ollama -->|falhou| Firebase
    Firebase -->|sucesso| Success
    Firebase -->|falhou| Demo
    Demo --> Success

    Success(["Resposta + AIResponseMetadata\n{ source, latencyMs, cached, model }"]) --> Update

    Update["chatStore atualiza\nmensagem do assistente"]
    Update --> UI["ChatScreen re-renderiza"]
```

---

## 2. Streaming XHR — OllamaChatRepository

```mermaid
sequenceDiagram
    participant Store as chatStore
    participant Repo as OllamaChatRepository
    participant XHR as XMLHttpRequest
    participant Server as Ollama Server

    Store->>Repo: sendMessage(userId, messages, prompt, onChunk)

    Repo->>XHR: open POST /api/chat
    Repo->>XHR: setRequestHeader Content-Type: application/json
    XHR->>Server: body: { model, messages, stream: true }

    Note over Repo: setTimeout(30s) → abort + reject se timeout

    loop readyState === 3 (chunks chegando)
        Server-->>XHR: linha NDJSON
        XHR->>Repo: onreadystatechange
        Repo->>Repo: newData = responseText.substring(processedLen)
        Repo->>Repo: processedLen = responseText.length
        Repo->>Repo: newData.split('\n')
        loop para cada linha não vazia
            Repo->>Repo: JSON.parse(line)
            Repo->>Repo: fullContent += chunkObj.message.content
            Repo-->>Store: onChunk(token)
            Store->>Store: messages[assistantId].content += token
        end
    end

    Server-->>XHR: readyState === 4 status 200
    XHR->>Repo: onload
    Repo->>Repo: clearTimeout(timeoutId)
    Repo-->>Store: resolve { content: fullContent }
```

---

## 3. Wiring do DI Container

```mermaid
flowchart LR
    subgraph Instantiation ["diStore.ts — buildChatRepositoryWithSelector()"]
        T[TorchChatRepository]
        O[OllamaChatRepository]
        F[FirebaseChatRepository]
        M[MockChatRepository]

        T --> RS
        O --> RS
        F --> RS
        M --> RS

        RS[RepositorySelector] --> Wrapper

        Wrapper["wrappedRepo: ChatRepository
        ─────────────────────────────
        sendMessage → selector.sendMessage()
        getMessages → firebase.getMessages()
        subscribe   → firebase.subscribe()
        delete      → firebase.deleteMessage()
        clear       → firebase.clearMessages()"]
    end

    Wrapper -->|container.set TOKENS.ChatRepository| DI[(DI Container)]
    DI -->|di.resolve| chatStore
    chatStore --> ChatScreen
```

---

## 4. Ciclo de vida de uma mensagem

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> Sending : usuário envia texto
    Sending --> StreamingResponse : repositório encontrado e streaming iniciado
    Sending --> DemoResponse : todos repositórios falharam

    StreamingResponse --> StreamingResponse : onChunk(token) → content += token
    StreamingResponse --> Complete : resolve({ content })

    DemoResponse --> Complete : getAIResponse(content)

    Complete --> Persisted : isLoading=false, MMKV salvo
    Persisted --> Idle
```

---

## 5. Cache interno do RepositorySelector

```mermaid
flowchart TD
    Req[Nova requisição] --> Key["getCacheKey(messages)\n= 'msg:' + lastUserMsg[0..100]"]
    Key --> Check{responseCache.get key}

    Check -->|encontrado| Age{Date.now - timestamp\n< 3.600.000ms?}
    Age -->|sim| CacheHit["Retorna\n{ response, metadata: cached=true }"]
    Age -->|não| Evict[deleta entrada] --> Miss

    Check -->|não encontrado| Miss[Chama repositório]
    Miss --> Store["addToCache(key, response)\nse size >= 100 → remove mais antigo"]
    Store --> Return[Retorna resultado]
```

---

## Referências

- Implementação completa: [`docs/AI_ARCHITECTURE.md`](./architeture.md)
- Feature de chat: [`docs/features/chat.md`](../features/chat.md)
- `src/core/ai/RepositorySelector.ts`
- `src/data/ollama/OllamaChatRepository.ts`
- `src/store/chatStore.ts`
- `src/store/diStore.ts`
