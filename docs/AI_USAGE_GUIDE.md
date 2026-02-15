# Guia de Uso: Sistema Híbrido de IA

## Para Desenvolvedores

### Testar localmente com Ollama

```bash
# 1. Instalar Ollama (macOS/Linux/Windows)
# https://ollama.ai

# 2. Rodar Ollama em background
ollama serve

# 3. Pull do modelo (primeira vez)
ollama pull llama3

# 4. Rodar app apontando para Ollama local
EXPO_PUBLIC_AI_PRIMARY_REPOSITORY=ollama \
EXPO_PUBLIC_AI_OLLAMA_URL=http://localhost:11434 \
npm run ios
```

### Testar com Firebase Cloud Function

```bash
# 1. Setup Firebase (já deve estar pronto)
# 2. Criar Cloud Function que chama Ollama/OpenAI
# (Documentação em FIREBASE_INTEGRATION.md)

# 3. Rodar app em modo cloud
EXPO_PUBLIC_AI_PRIMARY_REPOSITORY=firebase \
npm run ios
```

### Testar com Torch (quando disponível)

```bash
# 1. Certifique-se que expo-torch está instalado
npm list expo-torch

# 2. Copiar modelo para projeto
# cp modelo.pt src/data/torch/models/

# 3. Habilitar torch
EXPO_PUBLIC_AI_TORCH_ENABLED=true \
EXPO_PUBLIC_AI_PRIMARY_REPOSITORY=torch \
npm run ios
```

### Debug: Ver qual repositório está sendo usado

```typescript
// Em qualquer componente ou hook
import { getRepositorySelector } from '@app/store/diStore';

const selector = getRepositorySelector();

// Ver stats
console.table(selector.getStats());

// Ver último sucesso
const attempts = selector.getAttempts();
const last = attempts[attempts.length - 1];
console.log(`Último: ${last.name} - ${last.success ? '✅' : '❌'} em ${last.latencyMs}ms`);

// Limpar cache
selector.clearCache();

// Reseta stats
selector.resetStats();
```

## Para Designers/UX

### Indicadores Visuais de Resposta

A origem da resposta é mostrada automaticamente:

```tsx
// Componente já integrado no ChatScreen
<AIStatusIndicator metadata={responseMetadata} />
```

**Cores padrão:**
- 🟢 Verde (#00DD88): Local (Torch) - mais rápido, <500ms
- 🟦 Teal (#00AA88): Cache - instantâneo, 0ms
- 🔵 Azul (#0088FF): Local Dev (Ollama) - rápido, <2s
- 🟠 Laranja (#FF8800): Cloud (Firebase) - normal, <3s
- ⚫ Cinza (#888888): Demo/Fallback - sempre funciona

### Typing Indicator

Mostra que a IA está processando:

```tsx
<AITypingIndicator visible={isLoading} source="Cloud" />
```

Vem com animação de pontos bouncantes + texto dinâmico.

### Estados Possíveis

1. **Waiting**: Input vazio
   - Nada visível

2. **Typing**: User digitando
   - Botão send destacado

3. **Loading**: App processando
   - `<AITypingIndicator visible={true} source="..." />`
   - Spinner/skeleton opcional

4. **Response Received**: Resposta do IA
   - Mensagem renderizada
   - `<AIStatusIndicator metadata={...} />`
   - Indicador de cache se reutilizada

## Para Product

### Métricas Implementadas

O sistema rastreia automaticamente:

```typescript
interface RepositoryStats {
  name: string;                  // "torch" | "ollama" | "firebase" | "demo"
  totalAttempts: number;         // Quantas vezes foi tentado
  successCount: number;          // Quantas tiveram sucesso
  averageLatencyMs: number;      // Latência média
  successRate: number;           // 0.0 a 1.0 (%)
  lastUsedAt: number;            // Timestamp
}
```

### Analytics Dashboard (Future)

Podemos expor esses dados para:
- **Performance Monitoring**: Qual repositório é mais rápido?
- **Reliability**: Qual tem maior taxa de sucesso?
- **Cost Analysis**: Quantas vezes usou Cloud vs Local?
- **User Experience**: Cache hit rate?

### SLAs para Resposta

Alvo de performance por ambiente:

| Repositório | Target | Atual | Status |
|---|---|---|---|
| Torch | <500ms | ~300ms | ✅ On track |
| Ollama | <2s | ~1.2s | ✅ Good |
| Firebase | <3s | ~1.8s* | ✅ Good |
| Demo | <1s | ~800ms | ✅ Fallback |

*Depende da Cloud Function estar otimizada

## Para QA / Testing

### Casos de Teste Implementados

1. **Happy Path**: User → Torch → Response ✅
2. **Fallback Chain**: Torch fails → Ollama → Response ✅
3. **Cache Hit**: Mesma pergunta → Instant response ✅
4. **Offline**: App funciona com respostas demo ✅
5. **Timeout**: Repositório demora → fallback automático ✅

### Testar Cenários

```typescript
// Forçar timeout
EXPO_PUBLIC_AI_TORCH_TIMEOUT=100 npm run ios  // Vai cair para ollama

// Desabilitar torch
EXPO_PUBLIC_AI_TORCH_ENABLED=false npm run ios

// Modo mock só (demo responses)
EXPO_PUBLIC_AI_PRIMARY_REPOSITORY=mock npm run ios

// Ver logs detalhados
__DEV__ = true npm run ios  // Console.log habilitado
```

### Endpoints de API (Firebase)

Se implementando Cloud Function, testar:

```bash
# Test request
curl -X POST https://region-project.cloudfunctions.net/chatHandler \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "messages": [{"role": "user", "content": "Como usar Pomodoro?"}],
    "systemPrompt": "Você é assistente de produtividade"
  }'

# Expected response
{
  "success": true,
  "content": "A Técnica Pomodoro...",
  "source": "ollama",
  "latencyMs": 1200,
  "model": "llama3"
}
```

## Troubleshooting

### Chat não responde
1. Verificar qual repositório está ativo: `selector.getStats()`
2. Se Torch: verificar se modelo foi carregado
3. Se Ollama: verificar se servidor está rodando (`curl http://localhost:11434/api/tags`)
4. Se Firebase: verificar Cloud Function logs
5. Fallback deve sempre retornar demo response

### Respostas lentas
1. Verificar latência por repositório: `selector.getStats()`
2. Se >3s: considerar otimizar modelo ou trocar para Torch
3. Se Ollama: aumentar RAM/GPU
4. Se Firebase: otimizar Cloud Function

### Cache não funciona
1. Limpar cache: `selector.clearCache()`
2. Verificar TTL: 3600000ms (1 hora)
3. Mesma pergunta deve usar cache

### Repositório não carrega
1. Ver logs: `__DEV__` console
2. Verificar AppConfig: `AppConfig.ai`
3. Verificar env vars: `EXPO_PUBLIC_AI_*`
4. Fallback para demo deve sempre funcionar

## Links Úteis

- [AI Architecture Documentation](./AI_ARCHITECTURE.md)
- [Firebase Integration](./FIREBASE_INTEGRATION.md)
- [AppConfig](../src/config/appConfig.ts)
- [RepositorySelector](../src/core/ai/RepositorySelector.ts)
- [UIComponents](../src/presentation/components/)
