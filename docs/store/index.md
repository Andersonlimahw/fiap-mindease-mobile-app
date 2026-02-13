# Gerenciamento de Estado com Zustand

O MindEase App utiliza [Zustand](https://github.com/pmndrs/zustand) para o gerenciamento de estado global da aplicação. Zustand foi escolhido por sua simplicidade, performance e por ter uma API mínima e sem boilerplate.

## Stores

O estado da aplicação é dividido em "stores" (lojas) separadas, cada uma com uma responsabilidade específica.

### `authStore`

-   **Localização**: `src/store/authStore.ts`
-   **Responsabilidade**: Gerenciar o estado de autenticação do usuário com persistência.
-   **Estado**:
    -   `user`: Armazena as informações do usuário logado (User | null | undefined)
    -   `loading`: Estado de carregamento das operações de auth
    -   `isHydrated`: Indica se o estado foi restaurado do AsyncStorage
-   **Ações**:
    -   `signIn(provider, options?)`: Login com diferentes provedores
    -   `signUp(options)`: Registro de novo usuário
    -   `signInAnonymously()`: Login anônimo
    -   `signOut()`: Logout e limpeza do estado
    -   `setPartialProfile(patch)`: Atualiza parcialmente o perfil
    -   `isAuthenticated()`: Função que retorna se está autenticado
-   **Recursos Especiais**:
    -   Persistência automática com AsyncStorage
    -   Migração de versões de dados
    -   Hook conveniente `useAuth()` para componentes

### `diStore`

-   **Localização**: `src/store/diStore.ts`
-   **Responsabilidade**: Gerenciar o contêiner de Injeção de Dependência (DI).
-   **Estado**:
    -   `container`: Armazena a instância do contêiner de DI.
-   **Ações**:
    -   `setContainer`: Define o contêiner de DI.

### `themeStore`

-   **Localização**: `src/store/themeStore.ts`
-   **Responsabilidade**: Gerenciar branding (`MindEase` | `Neon`), modo Claro/Escuro e tokens de espaçamento/typography.
-   **Estado**:
    -   `brand`: Marca atual (`mindease` | `neon`).
    -   `mode`: Modo de cor atual (`light` | `dark`).
-   **Ações**:
    -   `setBrand`: Alterna entre as marcas.
    -   `setMode`: Altera explicitamente o modo.
    -   `toggleMode`: Alterna entre claro e escuro.
