# Documentação do Projeto MindEase Mobile

Bem-vindo à documentação oficial do MindEase Mobile App. Este documento serve como um guia central para desenvolvedores, designers e qualquer pessoa envolvida no projeto.

## Features (MindEase)

Documentação das features de produtividade do MindEase sendo migradas da versão web.

-   [Índice de Features](./features/index.md)
-   [Tasks Management](./features/tasks.md)
-   [Pomodoro Timer](./features/pomodoro.md)
-   [Focus Mode](./features/focus-mode.md)
-   [AI Chat](./features/chat.md)
-   [Accessibility](./features/accessibility.md)

## Arquitetura

A arquitetura do aplicativo segue os princípios de Clean Architecture, dividindo o código em camadas com responsabilidades distintas para promover um desenvolvimento mais organizado, escalável e testável.

-   [Diagrama de Arquitetura](./digrams/architeture.md)

## Fluxogramas

Os fluxogramas abaixo ilustram os principais fluxos de usuário e de dados dentro do aplicativo.

-   [Fluxo de Autenticação](./digrams/auth-flow.md)
-   [Fluxo para Obter Saldo](./digrams/get-balance-flow.md)

## Gerenciamento de Estado

Utilizamos Zustand para um gerenciamento de estado simples e eficiente.

-   [Documentação do Store](./store/index.md)

## Componentes

A documentação detalhada dos nossos componentes de UI reutilizáveis pode ser encontrada aqui.

-   [Documentação de Componentes](./components/index.md)

## Screens (Telas)

Documentação sobre a implementação das telas do aplicativo e padrões de navegação.

-   [Documentação de Screens](./screens/index.md)

## Firebase

Guias e detalhes sobre a integração com os serviços do Firebase.

-   [Visão Geral do Firebase](./firebase/index.md)

## Testes

Os testes unitários são executados com **Vitest** e cobrem os stores (Tasks, Pomodoro, Focus Mode, Accessibility, Chat) e o `FirebaseTaskRepository`.

- `npm run test:run` — executa todas as suítes
- `npm run test:coverage` — relatório opcional de cobertura
- `npm run typecheck` — garante consistência de tipos
- [Guia completo de testes](./testing/index.md)
