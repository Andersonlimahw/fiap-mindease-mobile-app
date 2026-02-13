# Guia de Testes MindEase Mobile

Este guia consolida como os testes estão estruturados atualmente e quais são os próximos passos para ampliar a cobertura.

## Stack Atual
- **Runner:** [Vitest](https://vitest.dev/) (config em `vitest.config.ts`)
- **Escopo coberto:**
  - Stores do Zustand (`auth`, `tasks`, `pomodoro`, `focusMode`, `accessibility`, `chat`)
  - `FirebaseTaskRepository`
- **Storage mocks:** `src/__tests__/setup.ts` sobrescreve `zustand/middleware` e SecureStorage para garantir execução determinística.

## Comandos
```bash
npm run test:run       # executa todas as suítes em modo run
npm run test:coverage  # gera relatório v8 (text/json/html)
npm run test:watch     # modo watch para desenvolvimento
npm run typecheck      # garante consistência de tipos
```

## Estrutura das Suítes
- `src/store/__tests__/*.test.ts`
  - Valida estado inicial, ações, integrações com DI e helpers.
  - Usa `useDIStore.getState` mockado para simular repositórios.
- `src/data/firebase/__tests__/FirebaseTaskRepository.test.ts`
  - Firestore mockado via `vi.hoisted` para garantir isolamento.
  - Exercita CRUD, parse e streams em tempo real.

## Próximos Passos
1. **Testes de UI (React Native Testing Library)**
   - Cobrir componentes críticos (TaskItem, Pomodoro UI, Focus Mode).
2. **Integração/ViewModels**
   - Validar hooks como `useTasksViewModel` com repositórios mockados.
3. **E2E (Detox ou Maestro)**
   - Automação de login, fluxo de tarefas e Pomodoro.
4. **Cobertura de Auth/DI**
   - Garantir que `authStore` e `diStore` tenham suites dedicadas com mocks de Firebase.

## Boas Práticas
- Sempre resetar stores com `setState` antes de cada caso de teste.
- Preferir `vi.useFakeTimers()` ao testar timers (ex.: Pomodoro, Focus Mode) para evitar flutuações.
- Capturar logs de erro esperados com `vi.spyOn(console, 'error')` quando necessário.
- Manter testes determinísticos evitando dependência em `Date.now()` (mockar quando preciso).

## Referências Úteis
- `src/__tests__/setup.ts` — configuração global de mocks
- `docs/analisys/QUICK_REFERENCE.md#testing-status` — status atualizado
- `docs/analisys/CODEBASE_ANALYSIS.md` — recomendações estratégicas
