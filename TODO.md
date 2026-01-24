# TODO - Tech Challenge Fase 04

## Status do Projeto

**Arquitetura:** ✅ Clean Architecture + MVVM implementado
**State Management:** ✅ Zustand implementado
**Última Atualização:** 2025-10-22

---

## 📋 Índice

1. [Performance e Otimização](#performance-e-otimização)
2. [Segurança no Desenvolvimento](#segurança-no-desenvolvimento)
3. [Programação Reativa](#programação-reativa)
4. [Documentação e Entrega](#documentação-e-entrega)
5. [Melhorias Adicionais (Opcional)](#melhorias-adicionais-opcional)

---

## 🚀 Performance e Otimização -> Thyago

### 1.1 Lazy Loading e Code Splitting

- [ ] **Implementar lazy loading de telas**

  - [ ] ✅ Usar `React.lazy()` para carregar telas sob demanda
  - [ ] ✅ Implementar componente `Suspense` com loading states
  - [ ] ✅ Aplicar lazy loading nas telas: PIX, Investimentos, Cartões
  - [ ] ✅ Criar componente de `Loading` reutilizável
  - Arquivo sugerido: `src/presentation/navigation/NavigationStack.tsx`

- [ ] **Implementar pré-carregamento de dados críticos**
  - [ ] ✅ Pré-carregar saldo e transações recentes ao fazer login
  - [ ] ✅ Implementar prefetch de dados do dashboard
  - [ ] ✅ Cache de imagens de perfil e logos
  - Arquivos: `src/presentation/screens/Home/HomeViewModel.ts`

### 1.2 Armazenamento em Cache

- [ ] **Implementar cache de requisições API**

  - [ ] ✅ Criar camada de cache para B3 API (cotações)
  - [ ] ✅ Implementar cache com TTL (Time To Live)
  - [ ] ✅ Usar AsyncStorage ou MMKV para cache persistente
  - [ ] ✅ Estratégia: Cache-First com revalidação em background
  - Arquivo sugerido: `src/infrastructure/cache/CacheManager.ts`

- [ ] **Cache de transações e dados do usuário**

  - [ ] ✅ Implementar cache local de transações recentes (últimos 30 dias)
  - [ ] ✅ Cache de saldo com sincronização
  - [ ] ✅ Implementar estratégia de invalidação de cache
  - Arquivos: `src/data/firebase/FirebaseTransactionRepository.ts`

- [ ] **Otimização de imagens**
  - [ ] ✅ Implementar cache de imagens com expo-image
  - [ ] ✅ Lazy loading de imagens
  - [ ] ✅ Compressão de imagens antes do upload
  - [ ] ✅ Usar placeholders durante carregamento

### 1.3 Otimizações Gerais

- [ ] **Melhorar performance de listas**

  - [ ] ✅ Implementar `FlashList` no lugar de `FlatList` (transações, PIX)
  - [ ] ✅ Adicionar `windowSize` e `maxToRenderPerBatch` otimizados
  - [ ] ✅ Implementar virtualização em listas longas
  - Arquivos: `src/presentation/screens/Extract/`, `src/presentation/screens/Pix/`

- [ ] **Bundle size e otimização de build**
  - [ ] ✅ Analisar bundle size com `npx expo-optimize`
  - [ ] ✅ Remover dependências não utilizadas
  - [ ] ✅ Tree-shaking de bibliotecas grandes
  - [ ] ✅ Configurar Hermes engine (se não configurado)

---

## 🔒 Segurança no Desenvolvimento -> Herbert

### 2.1 Segurança de API (CRÍTICO)

- [ ] **Remover token B3 API do código fonte**

  - [ ] ✅ Criar backend proxy/BFF para chamadas à B3 API
  - [ ] ✅ Mover `EXPO_PUBLIC_B3_API_KEY` para variável de servidor
  - [ ] ✅ Atualizar `StockRepository` para usar endpoint seguro
  - [ ] ✅ Adicionar rate limiting no backend
  - ⚠️ **PRIORIDADE MÁXIMA - VULNERABILIDADE CRÍTICA**
  - Arquivos: `src/data/firebase/FirebaseStockRepository.ts`, `.env`


### 2.2 Criptografia de Dados Sensíveis

- [ ] **Implementar criptografia de dados locais**

  - [ ] ✅ Migrar de AsyncStorage para MMKV com encryption
  - [ ] ✅ Criptografar dados sensíveis: saldo, transações, PIX keys
  - [ ] ✅ Usar expo-secure-store para credenciais
  - [ ] ✅ Implementar encryption key rotation
  - Arquivos: `src/infrastructure/storage/SecureStorage.ts`

- [ ] **Criptografia de comunicação**
  - [ ] Implementar SSL Pinning para Firebase
  - [ ] Validar certificados SSL
  - [ ] Adicionar HTTPS enforcement
  - Arquivo sugerido: `src/infrastructure/network/NetworkSecurity.ts`

### 2.3 Validação e Sanitização

- [ ] **Implementar validação robusta de inputs**

  - [ ] ✅ Criar camada de validação com Zod ou Yup
  - [ ] ✅ Validar todos os inputs de formulário
  - [ ] ✅ Sanitizar dados antes de enviar ao Firebase
  - [ ] ✅ Implementar validação de CPF/CNPJ
  - [ ] ✅ Validar chaves PIX (email, telefone, CPF, aleatória)
  - Arquivo sugerido: `src/domain/validation/`


---

## ⚡ Programação Reativa - Anderson

### 3.1 Otimizar Reatividade da Interface

- [ ] **Implementar debounce/throttle em inputs**

  - [ ] ✅ Search bar de transações (Extract)
  - [ ] ✅ Busca de favoritos PIX
  - [ ] ✅ Filtros de categoria
  - Arquivo: `src/presentation/screens/Extract/ExtractScreen.tsx`

- [ ] **Streams de estado global**
  - [ ] ✅ Implementar selectors otimizados
  - [ ] ✅ Evitar re-renders desnecessários
  - Arquivos: `src/presentation/providers/stores/`

### 3.2 Real-time Updates Otimizados

- [ ] **Melhorar listeners do Firebase**
- [ ] ✅ Implementar unsubscribe automático
- [ ] ✅ Batching de updates
- [ ] ✅ Throttle de notificações em tempo real
- Arquivos: `src/data/firebase/*Repository.ts`

---

## 📚 Documentação e Entrega - Bruna

### 4.1 README.md

- [ ] **Atualizar README com melhorias implementadas**

  - [ ] Adicionar seção "Tech Challenge Fase 04 - Melhorias"
  - [ ] Documentar novas features de segurança
  - [ ] Documentar otimizações de performance
  - [ ] Atualizar diagrama de arquitetura (se houver mudanças)
  - [ ] Adicionar métricas de performance (tempo de carregamento, bundle size)
  - Arquivo: `README.md`

- [ ] **Documentar tecnologias utilizadas**
  - [ ] Lista completa de dependências principais
  - [ ] Justificativa de escolhas técnicas
  - [ ] Patterns implementados

### 4.2 Documentação Técnica

- [ ] **Criar documentação de segurança**

  - [ ] Documento explicando medidas de segurança implementadas
  - [ ] Fluxo de autenticação biométrica
  - [ ] Política de criptografia
  - Arquivo sugerido: `docs/SECURITY.md`

- [ ] **Documentar otimizações de performance**
  - [ ] Estratégias de cache implementadas
  - [ ] Lazy loading e code splitting
  - [ ] Métricas antes/depois
  - Arquivo sugerido: `docs/PERFORMANCE.md`

### 4.3 Vídeo Demonstrativo

- [ ] **Gravar vídeo de até 5 minutos**
  - [ ] Demonstrar login com google
  - [ ] Mostrar melhorias de performance (tempo de carregamento)
  - [ ] Demonstrar features principais funcionando
  - [ ] Mostrar transações em tempo real
  - [ ] Destacar arquitetura MVVM + Clean Architecture
  - [ ] Mencionar segurança implementada
  - ⚠️ **Requisito obrigatório da entrega**

### 4.4 Testes

- [ ] **Implementar testes para novas features**
  - [ ] Testes unitários de validação
  - [ ] Login
  - [ ] Etc...

---

## 🎯 Melhorias Adicionais (Opcional) - Time

### 5.1 Monitoramento e Analytics

- [ ] **Implementar error tracking**

  - [ ] Logging estruturado
  - [ ] Crash reporting

- [ ] **Analytics de performance**
  - [ ] Firebase Performance Monitoring
  - [ ] Métricas de carregamento de telas
  - [ ] Tracking de ações do usuário

### 5.2 Acessibilidade

- [ ] **Melhorar acessibilidade**
  - [ ] Adicionar labels de acessibilidade
  - [ ] Suporte a screen readers
  - [ ] Contraste de cores adequado
  - [ ] Tamanhos de fonte ajustáveis

### 5.3 Offline First

- [ ] **Melhorar suporte offline**
  - [ ] Queue de ações offline
  - [ ] Sincronização quando voltar online
  - [ ] Indicador de status de conexão
  - [ ] Cache completo para modo offline

---

## 📊 Checklist Final de Entrega

- [ ] ✅ Arquitetura modular implementada (MVVM + Clean Architecture)
- [ ] ✅ State Management avançado (Zustand)
- [ ] ✅ Clean Architecture (SKIP - usando MVVM)
- [ ] ✅ Lazy loading e pré-carregamento
- [ ] ✅ Armazenamento em cache
- [ ] ✅ Autenticação segura (biometria)
- [ ] ✅ Criptografia de dados sensíveis
- [ ] ✅ README.md atualizado
- [ ] ✅ Repositório Git organizado
- [ ] ✅ Código testado e funcionando
- [ ] Vídeo demonstrativo (5 minutos)

---

## 🚨 Prioridades

### P0 - Crítico (fazer primeiro)

1. Remover token B3 API do código (segurança crítica)
2. Implementar validação robusta de inputs
3. Criptografia de dados sensíveis (MMKV/SecureStore)

### P1 - Alta (essencial para o Tech Challenge)

4. Implementar cache de API
5. Lazy loading de telas
6. Autenticação biométrica

### P2 - Média (melhorias importantes)

8. Otimização de imagens
9. FlashList para listas
10. SSL Pinning

### P3 - Baixa (polimento)

11. Analytics e monitoring
12. Testes abrangentes
13. Melhorias de acessibilidade

---

## 📝 Notas

- **Arquitetura MVVM + Clean Architecture:** Já implementado, não precisa refatorar
- **State Management:** Zustand já está bem implementado
- **Firebase:** Já configurado e funcionando em tempo real
- **Foco:** Segurança, Performance e Programação Reativa

---

## 🔗 Links Úteis

- [Análise Completa do Codebase](./CODEBASE_ANALYSIS.md)
- [Resumo da Análise](./ANALYSIS_SUMMARY.txt)
- [Referência Rápida](./QUICK_REFERENCE.md)
- [Índice de Análise](./ANALYSIS_INDEX.md)
- [Arquitetura Excalidraw](https://link.excalidraw.com/l/7XRBb57RGJp/5UGCXbSooLk)
- [Documentação Local](./docs/index.md)

---

**Última atualização:** 2025-10-22
**Versão:** 1.0
**Equipe:** Grupo 30 - FIAP Fase 04
