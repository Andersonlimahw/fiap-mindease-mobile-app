# Arquitetura Híbrida de IA - MindEase Mobile

## 📊 Visão Geral

O MindEase Mobile implementa um sistema inteligente de IA com múltiplas estratégias de fallback, garantindo melhor performance e experiência do usuário:

```
┌─────────────────────────────────────────────────────────┐
│           User sends message (ChatScreen)               │
└─────────────────────────────────┬───────────────────────┘
                                  ↓
                    ┌─────────────────────────┐
                    │  RepositorySelector     │
                    │  (Strategy + Cache)     │
                    └─────────┬───────────────┘
                              ↓
        ┌─────────────────────────────────────────────┐
        │ Try repositories in order:                 │
        ├─────────────────────────────────────────────┤
        │ 1️⃣ TorchChatRepository (on-device)         │
        │    ├─ <500ms (modelo leve)                  │
        │    └─ Offline funcionando                   │
        │                                             │
        │ 2️⃣ OllamaChatRepository (dev server)       │
        │    ├─ <2s (llama3 local)                    │
        │    └─ Qualidade high                        │
        │                                             │
        │ 3️⃣ FirebaseChatRepository + Cloud Function │
        │    ├─ <3s (nuvem)                          │
        │    └─ Melhor qualidade                      │
        │                                             │
        │ 4️⃣ MockChatRepository (demo)               │
        │    ├─ <1s (hardcoded)                       │
        │    └─ Sempre funciona                       │
        └─────────────────────────────────┬───────────┘
                                          ↓
                    ┌─────────────────────────────┐
                    │ Return with metadata:       │
                    ├─────────────────────────────┤
                    │ • source (torch/cloud/demo) │
                    │ • latencyMs                 │
                    │ • cached (sim/não)          │
                    │ • model name                │
                    └─────────────────────────────┘
                              ↓
                    ┌─────────────────────────────┐
                    │  Display with indicator:    │
                    ├─────────────────────────────┤
                    │ 🟢 Local (torch)           │
                    │ 🔵 Local Dev (ollama)      │
                    │ 🟠 Cloud (firebase)        │
                    │ ⚪ Demo (fallback)         │
                    └─────────────────────────────┘
```

## 🏗️ Componentes Principais

### 1. **RepositorySelector** (`src/core/ai/RepositorySelector.ts`)
- Orquestra fallback chain
- Implementa retry com timeout
- Cache de respostas com TTL
- Rastreamento de stats por repositório

**Responsabilidades:**
- Tentar repositório principal primeiro
- Fallback automático em timeout/erro
- Cachear respostas bem-sucedidas (1 hora TTL)
- Registrar métricas (latência, taxa de sucesso)

### 2. **TorchChatRepository** (`src/data/torch/TorchChatRepository.ts`)
- Executa modelos PyTorch localmente (when ready)
- On-device inference, sem conectividade
- Fallback para respostas demo se modelo não carregar

**Status Atual:**
- ✅ Estrutura criada
- ⏳ Aguardando disponibilidade de expo-torch estável
- 📋 TODOs para integração de modelo real

### 3. **AppConfig Expandido** (`src/config/appConfig.ts`)
- Configuração centralizada de estratégia de IA
- Suporte a múltiplos repositórios
- Timeouts por repositório
- Feature flags

**Variáveis de ambiente:**
```bash
# Estratégia primária
EXPO_PUBLIC_AI_PRIMARY_REPOSITORY=firebase  # torch|ollama|firebase|mock

# Torch config
EXPO_PUBLIC_AI_TORCH_ENABLED=true
EXPO_PUBLIC_AI_TORCH_MODEL=distilbert-base-multilingual-cased
EXPO_PUBLIC_AI_TORCH_MODEL_URL=https://...

# Ollama config (dev)
EXPO_PUBLIC_AI_OLLAMA_URL=http://localhost:11434
EXPO_PUBLIC_AI_OLLAMA_MODEL=llama3
```

### 4. **UI Components** (Phase 4)

#### AIStatusIndicator
```tsx
<AIStatusIndicator metadata={responseMetadata} />
```
- Mostra origem (Local/Cloud/Demo)
- Exibe latência
- Indica se foi cacheado
- Cores visuais por fonte

#### AITypingIndicator
```tsx
<AITypingIndicator visible={isLoading} source="Cloud" />
```
- Animação de digitação
- Mostra qual repositório está processando
- Feedback visual para o usuário

### 5. **DI Container Integrado** (`src/store/diStore.ts`)
```typescript
// Automaticamente cria:
// - TorchChatRepository
// - OllamaChatRepository
// - FirebaseChatRepository  
// - MockChatRepository
// E envolve com RepositorySelector

// Wrapper invisível ao usuário - mesmo contrato de ChatRepository
container.set(TOKENS.ChatRepository, wrappedRepo);
```

## 📝 Tipos e Interfaces

```typescript
enum AIResponseSource {
  LOCAL = 'local',              // TorchChatRepository
  LOCAL_CACHED = 'local_cached', // Cache
  OLLAMA = 'ollama',            // Dev server
  CLOUD = 'cloud',              // Firebase
  DEMO = 'demo',                // Fallback
}

interface AIResponseMetadata {
  source: AIResponseSource;
  latencyMs: number;
  cached: boolean;
  confidence?: number;
  model?: string;
  timestamp: number;
}

interface RepositoryStats {
  name: string;
  totalAttempts: number;
  successCount: number;
  averageLatencyMs: number;
  successRate: number; // 0-1
}
```

## 🔄 Fluxo de Execução

### 1. User sends message
```typescript
const { sendMessage } = useChatActions();
await sendMessage("Como usar Pomodoro?");
```

### 2. Store resolves repository
```typescript
const repo = useDIStore.getState().di.resolve(TOKENS.ChatRepository);
// Returns wrapped repo with RepositorySelector
```

### 3. Selector tries in order
```typescript
try {
  // 1. Try Torch (timeout 3s)
  response = await torchRepo.sendMessage(userId, messages, systemPrompt);
} catch {
  try {
    // 2. Try Ollama (timeout 30s)
    response = await ollamaRepo.sendMessage(userId, messages, systemPrompt);
  } catch {
    // 3. Try Firebase Cloud Function (timeout 10s)
    response = await firebaseRepo.sendMessage(userId, messages, systemPrompt);
  }
}
// 4. If all fail, fallback to demo responses
```

### 4. Return with metadata
```typescript
return {
  response: { content: "..." },
  metadata: {
    source: 'torch',
    latencyMs: 350,
    cached: false,
    timestamp: Date.now(),
  }
};
```

### 5. UI displays with indicator
```tsx
<ChatBubble message={message} />
<AIStatusIndicator metadata={metadata} /> {/* 🟢 Local • 350ms */}
```

## 🎯 Configuração por Ambiente

### Development
```env
EXPO_PUBLIC_AI_PRIMARY_REPOSITORY=ollama
EXPO_PUBLIC_AI_TORCH_ENABLED=true
EXPO_PUBLIC_AI_OLLAMA_URL=http://localhost:11434
```
Cadeia: Torch → Ollama → Firebase → Demo

### Production  
```env
EXPO_PUBLIC_AI_PRIMARY_REPOSITORY=firebase
EXPO_PUBLIC_AI_TORCH_ENABLED=true
```
Cadeia: Torch → Firebase → Demo

### Testing/Demo
```env
EXPO_PUBLIC_AI_PRIMARY_REPOSITORY=mock
EXPO_PUBLIC_AI_TORCH_ENABLED=false
```
Cadeia: Demo (instantâneo)

## 📊 Monitoring e Debugging

### Acessar stats do repositório
```typescript
import { getRepositorySelector } from '@app/store/diStore';

const selector = getRepositorySelector();
const stats = selector.getStats();
console.table(stats);

// Output:
// ┌─────────┬──────────┬────────┬──────────┬────────────┐
// │ name    │ source   │ total  │ success  │ avgLatency │
// ├─────────┼──────────┼────────┼──────────┼────────────┤
// │ torch   │ local    │ 15     │ 12       │ 350ms      │
// │ ollama  │ ollama   │ 3      │ 3        │ 1200ms     │
// │ firebase│ cloud    │ 0      │ 0        │ 0ms        │
// │ demo    │ demo     │ 0      │ 0        │ 0ms        │
// └─────────┴──────────┴────────┴──────────┴────────────┘
```

### Log de tentativas
```typescript
const attempts = selector.getAttempts();
attempts.forEach(att => {
  console.log(`${att.name}: ${att.success ? '✅' : '❌'} (${att.latencyMs}ms)`);
});
```

## 🚀 Próximos Passos

### Phase 2.0 (3-6 meses)
- ✅ Implementar modelo real no TorchChatRepository
- ✅ Fine-tuning com dataset português
- ✅ Otimização de tamanho (quantization)
- ✅ A/B testing: Torch vs Cloud

### Phase 3.0 (6-12 meses)
- Modelo especializado para produtividade
- Multi-turn conversation com contexto
- Persistent context em Firebase
- Fine-tuning com dados de usuários

### Phase 4.0+ (Futuro)
- Streaming responses para modelos maiores
- Voice input/output (TTS)
- RAG com documentos de ajuda
- Recomendações personalizadas

## ⚠️ Considerações Importantes

### Quando Torch será pronto
expo-torch está em beta. Status:
- iOS: suporte básico, libtorch disponível
- Android: PyTorch Mobile funcional
- Performance: <500ms em modelos leves confirmado
- Documentação: ainda em desenvolvimento

### Plano B se Torch não funcionar
Se expo-torch não chegar a production-ready:
1. Usar `react-native-pytorch` como alternativa
2. Manter Ollama como primary (mesmo custo infra)
3. Continuar com Cloud Function fallback

### Segurança
- Dados do usuário nunca deixam dispositivo no Torch
- Mensagens cacheadas apenas localmente
- Firebase usa security rules por userId
- Sem análise de dados de conversa para publicidade

## 📚 Referências

- AppConfig: `src/config/appConfig.ts`
- RepositorySelector: `src/core/ai/RepositorySelector.ts`
- TorchChatRepository: `src/data/torch/TorchChatRepository.ts`
- Types: `src/types/ai.ts`
- Components: `src/presentation/components/AIStatusIndicator.tsx`
- Store: `src/store/diStore.ts`

## 🔗 Arquitetura Relacionada

- [Firebase Integration Guide](./FIREBASE_INTEGRATION.md)
- [Clean Architecture](../CLAUDE.md#architecture)
- [DI Container](../src/core/di/container.tsx)
- [Chat Store](../src/store/chatStore.ts)
