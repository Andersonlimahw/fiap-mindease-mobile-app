# MindEase — Roteiro de Pitch

> **Grupo 30 | FIAP | Tech Challenge Fase 4**  
> Alexsander Perusso · Anderson Lima · Bruna Barreto · Herbert Rezende · Thyago Pereira

---

## 🎯 Slide 1 — Abertura (Hook)

**Título:** *"Você é produtivo — ou apenas ocupado?"*

**Fala sugerida:**
> "Quantas vezes você termina um dia exausto e com a sensação de que não fez nada do que realmente importava?  
> Vivemos conectados, mas desconectados de nós mesmos. Notificações, burnout, falta de foco — são epidemias silenciosas.  
> O MindEase nasceu para mudar isso."

---

## 🧩 Slide 2 — O Problema

**Título:** *"3 dores reais de quem tenta ser produtivo hoje"*

### Dor 1 — Fragmentação de Ferramentas
A pessoa usa Notion para tarefas, app separado para foco, e nenhuma delas fala de bem-estar. **Não existe um centro de comando** que una produtividade + saúde mental + IA.

### Dor 2 — Falta de continuidade entre dispositivos
Tarefas criadas no celular não aparecem na web. Configurações se perdem. **O contexto do usuário se evapora** entre plataformas.

### Dor 3 — Ferramentas que não respeitam a diversidade
Usuários com baixa visão, dislexia ou mobilidade reduzida são sistematicamente ignorados. **Acessibilidade é um afterthought**, não um pilar.

---

## 💡 Slide 3 — A Solução: MindEase

**Título:** *"Um único app. Mente e produtividade no mesmo lugar."*

### O que é
MindEase é um **aplicativo móvel de produtividade e bem-estar** construído com React Native + Expo. Ele centraliza:

| Feature | Descrição |
|---------|------------|
| 📋 **Gestão de Tarefas** | CRUD com subtarefas, prioridades, progresso em tempo real |
| 🍅 **Pomodoro Timer** | Sessões focus/break configuráveis com estatísticas |
| 🌿 **Modo Foco** | Sons ambientes (chuva, floresta, café, oceano) com exposição sonora via expo-av |
| 🤖 **Chat IA** | Assistente de produtividade local via Ollama (LLM sem dependência de cloud) |
| ♿ **Acessibilidade** | Fonte ajustável, alto contraste, modos daltônico, redução de motion |
| 🔐 **Autenticação** | Google, Apple, email/senha, anônimo — com biometria (Face ID / Touch ID) |

### Como resolve
- **Sincronização em tempo real** via Firebase Firestore (subscriptions reativas, sem polling)
- **Arquitetura multi-plataforma**: Mobile (Expo) + Web compartilham a mesma base de dados
- **IA local**: Chat com Ollama permite uso sem latência de API externa e sem custo por token

---

## 🏗️ Slide 4 — Arquitetura

**Título:** *"Clean Architecture aplicada de verdade num app mobile"*

```
┌─────────────────────────────────────────────┐
│              PRESENTATION LAYER             │
│  Screens · Navigation · Hooks · Components  │
│  Zustand Store · Theme Tokens               │
└────────────────────┬────────────────────────┘
                     │ (via DI Container)
┌────────────────────▼────────────────────────┐
│              APPLICATION LAYER              │
│  Use Cases: SignIn, CreateTask, SendMessage  │
│  DTOs · Validators (Zod)                    │
└────────────────────┬────────────────────────┘
                     │ (Repository Interfaces)
┌────────────────────▼────────────────────────┐
│               DOMAIN LAYER                  │
│  Entities: Task, User, PomodoroSession       │
│  Repository Interfaces (contratos puros)     │
└────────────────────┬────────────────────────┘
                     │ (Implementations)
┌────────────────────▼────────────────────────┐
│                DATA LAYER                   │
│  FirebaseTaskRepository · OllamaChat         │
│  MockRepositories (fallback para dev/teste)  │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│            INFRASTRUCTURE LAYER             │
│  FirebaseAPI · SecureStorage · CacheManager  │
│  expo-av · expo-local-authentication         │
└──────────────────────────────────────────────┘
```

### Princípios aplicados
- **Inversão de Dependência**: Presentation → Interfaces → Implementações via DI
- **Mock Mode**: Troca total de Firebase por mocks sem alterar uma linha de código de tela
- **SOLID**: Repository para cada entidade com contrato separado da implementação

**Referências de código:**
- DI Container: [`src/core/di/container.tsx`](../../src/core/di/container.tsx)
- Interfaces dos repositórios: [`src/domain/repositories/`](../../src/domain/repositories/)
- Implementação Firebase: [`src/data/firebase/FirebaseTaskRepository.ts`](../../src/data/firebase/FirebaseTaskRepository.ts)
- Use Cases: [`src/application/`](../../src/application/)

---

## 📱 Slide 5 — Features em Detalhe

### 🔐 Segurança de Dados
- Tokens e credenciais via `expo-secure-store` (Keychain iOS / Keystore Android)
- Armazenamento local criptografado com `react-native-mmkv`
- Biometria nativa com `expo-local-authentication`

```typescript
// src/infrastructure/storage/SecureStorage.ts
// Uso de SecureStore para credenciais sensíveis
await SecureStore.setItemAsync('auth_token', token);
```

### ⚡ Performance
- **FlashList** no lugar de FlatList para listas de alta densidade
- **Lazy loading** de telas com `React.lazy` + `Suspense`
- **Cache multi-estratégia**: Cache-First, Network-First, Stale-While-Revalidate

```typescript
// src/infrastructure/cache/CacheManager.ts
await CacheManager.get('tasks', userId, { strategy: 'stale-while-revalidate', ttl: 60 });
```

### 🔄 Programação Reativa
- Firebase `onSnapshot` em tempo real — tarefas atualizam sem refresh
- Subscriptions gerenciadas com cleanup automático

```typescript
// src/data/firebase/FirebaseTaskRepository.ts
subscribe(userId, callback) {
  const q = query(getUserTasksCollection(userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap => callback(parseTasksFrom(snap)));
}
```

### 🤖 IA Local com Ollama
- LLM rodando localmente — zero custo por token, zero latência de rede externa
- Contexto da conversa persistido por sessão

```typescript
// src/data/ollama/OllamaChatRepository.ts
const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
  method: 'POST',
  body: JSON.stringify({ model, messages, stream: false })
});
```

---

## 🌟 Slide 6 — Motivações & Diferenciais

**Título:** *"Por que MindEase importa além do tech challenge?"*

### Motivação Técnica
1. **Clean Architecture real** — não é só teoria. Cada camada tem responsabilidade única e testável independentemente.
2. **Firebase + Local AI** — combinação pragmática: cloud para dados, local para inteligência.
3. **Modo Mock** — desenvolvemos e testamos feature completa sem depender de infra externa.

### Motivação de Produto
1. **Bem-estar como feature de primeira classe** — não é um ícone extra no menu. É o coração da UX.
2. **Acessibilidade por design** — font size dinâmico, high contrast, modos daltônico construídos desde o início.
3. **Cross-platform real** — mobile e web compartilham base de dados sem reescrever lógica.

### Diferencial vs. Concorrentes
| Concorrente | O que falta | MindEase resolve |
|------------|-------------|-----------------|
| Todoist | Sem wellness | Pomodoro + sons ambientes integ. |
| Forest | Sem IA | Chat assistente com LLM local |
| Headspace | Sem produtividade | Tarefas + timer integrados |
| Notion | Complexo demais | UX focada, acessível, mobile-first |

---

## 🔬 Slide 7 — Decisões Técnicas Justificadas

### Por que Expo + React Native?
- Build único para iOS e Android, compartilhando ~95% do código
- Acesso a APIs nativas críticas (biometria, Firebase, audio) via Expo modules
- EAS Build para CI/CD sem mac local

### Por que Clean Architecture em mobile?
- Separação real permite trocar Firebase por outro backend sem tocar nas telas
- Testabilidade: use cases são pure functions testáveis com Jest/Vitest
- Reference: [`src/domain/repositories/TaskRepository.ts`](../../src/domain/repositories/TaskRepository.ts)

### Por que Zustand em vez de Redux?
- API mínima, zero boilerplate
- Selectors otimizados individualmente para evitar re-renders
- Compatível nativamente com React Native

### Por que subcoleção `users/{uid}/tasks` no Firestore?
- Segurança por design: regras Firestore isolam dados por usuário
- Performance: queries não varrem a coleção inteira
- Escalabilidade: cada usuário tem seu próprio namespace de dados

---

## 📊 Slide 8 — Impacto & Próximos Passos

**Título:** *"Do Tech Challenge para o mercado"*

### O que já foi feito
- [x] Auth multi-provider (Google, Apple, Email, Anônimo)
- [x] CRUD de tarefas com subtarefas em tempo real
- [x] Pomodoro + sessões de foco com áudio ambiente
- [x] Chat IA com Ollama (LLM local)
- [x] Acessibilidade (fonte, contraste, daltonismo, motion)
- [x] Segurança (biometria, secure storage, Zod validation)

### Roadmap
- [ ] Notificações push com schedules de Pomodoro
- [ ] Dashboard de produtividade com gráficos de histórico
- [ ] IA generativa de sugestão de tarefas baseada em padrões do usuário
- [ ] Modo colaborativo (grupos, atribuição de tarefas)
- [ ] Publicação na App Store e Play Store (EAS Build configurado)

---

## 🙏 Slide 9 — Encerramento

**Título:** *"MindEase: porque produtividade sem bem-estar é só sobrevivência."*

**Fala sugerida:**
> "Acreditamos que tecnologia pode ser um aliado do ser humano, não mais um gerador de ansiedade.  
> O MindEase é nossa resposta ao caos digital — um app que te ajuda a ser mais focado, mais calmo e mais humano.  
> Obrigado."

---

## 👥 Equipe

| Nome | RM | E-mail |
|------|----|--------|
| Alexsander de Almeida Perusso | RM364149 | alexperusso@gmail.com |
| Anderson Santos De Lima | RM363575 | andersonlimahw@gmail.com |
| Bruna Barreto Ribeiro | RM362095 | bru.barretoribeiro@gmail.com |
| Herbert Rezende Ferreira | RM363976 | hrezendeferreira@gmail.com |
| Thyago do Nascimento Pereira | RM362540 | thyagopereira41@gmail.com |

---

*[Figma UI/UX](https://www.figma.com/design/p6jsQDxXRoS8ukHQ9a6Kff/MindEase-UI-UX?node-id=11-5253&t=VZfYF8xKgwRlcss0-1) · [Excalidraw Architecture](https://link.excalidraw.com/l/7XRBb57RGJp/5UGCXbSooLk)*
