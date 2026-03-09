# MindEase — Prompts para Gamma.app

> Use o modo **"Generate from text"** no Gamma. Cole cada bloco abaixo como input de um slide separado, ou cole todos de uma vez para geração em lote.

---

## 🎨 Configuração Inicial (Cole antes dos slides)

```
Create a professional pitch deck presentation for MindEase, a mobile productivity and wellness app. 
Use a dark, modern aesthetic with deep navy (#0F172A) background, electric blue (#3B82F6) accents, 
and clean white text. Typography: bold headings, generous spacing. Include subtle gradient cards 
and iconography for each feature. Style: modern tech startup pitch, clean and sophisticated.
```

---

## Prompt — Slide 1: Hook / Abertura

```
Create a hero slide for a tech pitch deck with:

Title: "Você é produtivo — ou apenas ocupado?"

Subtitle: "Vivemos numa epidemia silenciosa de burnout e falta de foco. O MindEase nasceu para mudar isso."

Visual: Full-screen dark background with a soft glowing brain or mind icon in the center. 
Electric blue and teal gradient. Minimalist.

Add a small tagline at the bottom: "Produtividade · Bem-estar · Inteligência Artificial"
```

---

## Prompt — Slide 2: O Problema

```
Create a "Problem" slide for a pitch deck with 3 pain points in a 3-column card layout:

Card 1:
Icon: 🧩 Broken puzzle
Title: "Fragmentação de ferramentas"
Text: "O usuário usa Notion, Forest, e nenhum deles fala entre si. Não existe centro de comando."

Card 2:
Icon: 🔄 Broken sync arrows
Title: "Dados que não sincronizam"
Text: "Tarefas criadas no celular somem na web. O contexto do usuário se evapora."

Card 3:
Icon: ♿ Accessibility icon crossed out
Title: "Acessibilidade ignorada"
Text: "Usuários com baixa visão e dislexia são tratados como afterthought, não como prioridade."

Style: Dark cards with red/orange warning accent borders. Bold icons on top of each card.
```

---

## Prompt — Slide 3: A Solução

```
Create a "Solution" slide for a pitch deck:

Title: "MindEase — Um único app. Mente e produtividade no mesmo lugar."

Content: A feature grid with 6 cards in 2 rows of 3:

Row 1:
- 📋 Gestão de Tarefas: CRUD com subtarefas, prioridades e progresso em tempo real
- 🍅 Pomodoro Timer: Sessões focus/break configuráveis com estatísticas
- 🌿 Modo Foco: Sons ambientes (chuva, floresta, café, oceano)

Row 2:
- 🤖 Chat IA: Assistente local via Ollama — sem custo por token
- ♿ Acessibilidade: Alto contraste, tamanho de fonte, modos daltônico
- 🔐 Segurança: Biometria (Face ID/Touch ID) + armazenamento criptografado

Style: Each card has an emoji icon, bold title, subtle description. Dark cards with blue glow border. Clean grid layout.
```

---

## Prompt — Slide 4: Arquitetura

```
Create a technical architecture slide for a pitch deck:

Title: "Clean Architecture aplicada de verdade num app mobile"

Content: A 5-layer vertical diagram showing the architecture layers from top to bottom:

Layer 1 (top): PRESENTATION — "Screens · Navigation · Zustand Store · Theme Tokens"
Layer 2: APPLICATION — "Use Cases · Validators Zod · DTOs"
Layer 3: DOMAIN — "Entities: Task, User, Session · Repository Interfaces"
Layer 4: DATA — "FirebaseTaskRepository · OllamaChat · Mock Repositories"
Layer 5 (bottom): INFRASTRUCTURE — "FirebaseAPI · SecureStorage · CacheManager · expo-av"

Add arrows showing "Dependency Inversion" flowing from top to bottom through interfaces.

Add a sidebar note: "Troca total de Firebase por mocks sem mudar uma única linha de tela."

Style: Dark tech diagram, electric blue connecting lines, gradient boxes for each layer. Monospace font for layer labels.
```

---

## Prompt — Slide 5: Features Técnicas em Destaque

```
Create a technical deep-dive slide for a pitch deck with 4 highlight feature cards:

Title: "Decisões técnicas que fazem a diferença"

Card 1: ⚡ Performance
"FlashList (alta densidade), Lazy Loading de telas, Cache multi-estratégia (TTL, SWR)"

Card 2: 🔄 Programação Reativa
"Firebase onSnapshot — tarefas atualizam em tempo real sem refresh manual. Subscriptions com cleanup automático."

Card 3: 🤖 IA Local
"Ollama LLM rodando localmente. Zero custo por token, zero latência de API externa."

Card 4: 🔐 Segurança
"Secure Keychain para credenciais. MMKV criptografado. Validação robusta com Zod."

Include a small code snippet block for the reactive subscription:
"onSnapshot(q, snap => callback(parseTasks(snap)))"

Style: 2x2 card grid, dark background, each card with a distinct accent color (blue, green, purple, orange).
```

---

## Prompt — Slide 6: Por que MindEase?

```
Create a "Why MindEase?" slide for a pitch deck:

Title: "Diferenciais vs. Concorrentes"

Content: A comparison table with 4 rows:

| Concorrente | O que falta | MindEase resolve |
|-------------|-------------|-----------------|
| Todoist | Sem wellness | Pomodoro + sons ambientes integrados |
| Forest | Sem IA | Chat assistente com LLM local |
| Headspace | Sem produtividade | Tarefas + timer integrados |
| Notion | Complexo demais | UX focada, acessível, mobile-first |

Below the table, add 3 motivational pillars in a row:
✅ "Clean Architecture real" — cada camada isolada e testável  
✅ "Bem-estar como feature de primeira classe"  
✅ "Acessibilidade por design desde o início"

Style: Modern table with alternating dark rows, green checkmarks, bold competitor names.
```

---

## Prompt — Slide 7: Tech Stack

```
Create a tech stack slide for a pitch deck:

Title: "Stack tecnológica moderna e battle-tested"

Content: A logo/badge grid organized by category:

Mobile & Cross-platform:
- React Native + Expo (SDK 54)
- TypeScript
- EAS Build

Backend & Data:
- Firebase Firestore (real-time sync)
- Firebase Auth (multi-provider)
- Firebase Storage

State & Performance:
- Zustand (state management)
- FlashList (@shopify)
- expo-image (cache otimizado)

Security:
- expo-local-authentication (biometrics)
- expo-secure-store (Keychain)
- react-native-mmkv (encrypted storage)
- Zod (schema validation)

AI:
- Ollama (LLM local)
- expo-av (audio)

Style: Badge/pill layout for each technology, organized in colored category blocks. Dark background, modern font.
```

---

## Prompt — Slide 8: Roadmap

```
Create a roadmap slide for a pitch deck:

Title: "Do Tech Challenge para o mercado"

Left column — "✅ O que já fizemos":
- Auth multi-provider (Google, Apple, Email, Anônimo)
- CRUD de tarefas em tempo real com Firebase
- Pomodoro + Modo Foco com áudio ambiente
- Chat IA com Ollama (LLM local)
- Acessibilidade completa
- Biometria e armazenamento seguro

Right column — "🚀 Próximos passos":
- Notificações push com schedules de Pomodoro
- Dashboard de produtividade com gráficos
- IA generativa de sugestão de tarefas
- Modo colaborativo (grupos e atribuição)
- Publicação App Store e Play Store

Style: Two-column layout, left with green checkmarks (completed), right with blue rocket markers (planned). Horizontal timeline bar at bottom showing progression.
```

---

## Prompt — Slide 9: Encerramento

```
Create a closing/CTA slide for a pitch deck:

Title (large, centered): "MindEase"

Subtitle: "Porque produtividade sem bem-estar é só sobrevivência."

Quote block (centered, highlighted):
"Acreditamos que tecnologia pode ser um aliado do ser humano — não mais um gerador de ansiedade."

Team grid (5 members, small cards):
- Alexsander Perusso · RM364149
- Anderson Lima · RM363575
- Bruna Barreto · RM362095
- Herbert Rezende · RM363976
- Thyago Pereira · RM362540

Footer links:
🎨 Figma UI/UX  |  🏗️ Excalidraw Architecture  |  📱 FIAP — Grupo 30

Style: Full-bleed dark slide, large centered logo/wordmark, subtle glow effect behind title, team names in small elegant cards at bottom.
```

---

## 💡 Dicas de uso no Gamma

1. **Geração em lote**: Cole o prompt de configuração inicial + todos os slides num único texto e selecione "Create Presentation" para gerar tudo de uma vez.
2. **Refinamento**: Use os prompts individuais para regenerar slides específicos que não ficaram como esperado.
3. **Imagens**: Peça ao Gamma para usar "AI-generated visuals" para smartphone mockups, diagramas e ícones.
4. **Paleta**: Configure a paleta manualmente como `#0F172A, #3B82F6, #FFFFFF` nas configurações de tema do Gamma.
5. **Exportação**: Exporte em PDF para apresentar ao vivo, ou compartilhe o link público do Gamma.
