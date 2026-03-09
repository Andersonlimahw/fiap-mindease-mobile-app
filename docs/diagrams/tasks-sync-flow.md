# Fluxo de Sincronização de Tasks

Este documento detalha como o MindEase gerencia a sincronização de tarefas entre o aplicativo móvel, a versão web e o Firestore.

## 1. Fluxograma de Sincronização

```mermaid
flowchart TD
    A[Início: App Mobile] --> B{Usuário Autenticado?}
    B -- Não --> C[Modo Offline/Mocks]
    B -- Sim --> D[FirebaseTaskRepository init]
    
    D --> E[Assinar Mudanças: subscribe]
    E --> F{snapshot do Firestore}
    F --> G[Parse de Dados: parseTask]
    G --> H[Atualizar store: tasksStore]
    H --> I[UI atualiza em tempo real]
    
    subgraph User Actions
        J[Criar Task] --> K[FirebaseTaskRepository.create]
        K --> L[Firestore setDoc]
        L --> F
    end
```

## 2. Diagrama de Sequência: Listagem de Tasks

Este diagrama ilustra como as tarefas são recuperadas e por que garantimos a filtragem por `userId`.

```mermaid
sequenceDiagram
    participant U as Usuário
    participant UI as TasksScreen
    participant VM as TasksViewModel
    participant ST as tasksStore
    participant RP as FirebaseTaskRepository
    participant FS as Firestore

    U->>UI: Abre tela de Tasks
    UI->>VM: getTasks(userId)
    VM->>RP: subscribe(userId, callback)
    RP->>FS: query(tasks, where('userId', '==', userId))
    FS-->>RP: Documentos (Snapshot)
    RP->>RP: map documents to Task entity
    RP-->>ST: callback(tasks)
    ST->>ST: update state
    ST-->>UI: Re-render list
```

## 3. Considerações Multi-plataforma (Web vs Mobile)

Para garantir que as tarefas sincronizem corretamente entre Web e Mobile, seguimos estas regras:

1.  **Coleção Raiz**: Todas as tarefas são armazenadas na coleção raiz `tasks`.
2.  **Identificação**: Cada documento deve conter o campo `userId` (case-sensitive).
3.  **Timestamps**: Utilizamos `serverTimestamp()` para garantir consistência entre diferentes fusos horários e dispositivos.
4.  **Casing**: O campo deve ser sempre `userId`. Documentos com `userID` ou `UserID` não serão listados no aplicativo móvel devido à filtragem rigorosa por `userId`.
