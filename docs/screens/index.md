# Screens (Telas)

Este documento descreve como as screens estão implementadas no aplicativo MindEase, incluindo arquitetura, padrões de navegação e exemplos detalhados.

## Arquitetura de Screens

### Estrutura de Arquivos

As screens estão organizadas em `src/presentation/screens/` seguindo uma estrutura por funcionalidade:

```
src/presentation/screens/
├── Auth/
│   ├── LoginScreen.tsx
│   └── RegisterScreen.tsx
├── Home/
│   ├── HomeScreen.tsx
│   └── HomeScreen.styles.ts
├── Tasks/
│   └── TasksScreen.tsx
├── Pomodoro/
│   └── PomodoroScreen.tsx
├── FocusMode/
│   └── FocusModeScreen.tsx
├── Chat/
│   └── ChatScreen.tsx
├── User/
│   └── UserScreen.tsx
└── Onboarding/
    └── OnboardingScreen.tsx
```

### Padrões de Implementação

#### 1. Screen Básica com Stores + Hooks

**Exemplo: HomeScreen.tsx**

```typescript
import React, { useMemo } from "react";
import { useAuth } from "@store/authStore";
import { usePendingTasks } from "@store/tasksStore";
import { usePomodoroStats } from "@store/pomodoroStore";
import { useFadeSlideInOnFocus } from "@presentation/hooks/animations";

export const HomeScreen: React.FC<any> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const pendingTasks = usePendingTasks();
  const { completedSessions, totalFocusTime } = usePomodoroStats();
  const { animatedStyle } = useFadeSlideInOnFocus();
  const theme = useTheme();
  const styles = useMemo(() => makeHomeStyles(theme), [theme]);

  return (
    <Animated.ScrollView style={styles.container}>
      {/* Conteúdo da screen */}
    </Animated.ScrollView>
  );
};
```

**Características:**
- Uso direto dos stores Zustand para lógica de negócio
- Integração com Auth + Pomodoro + Tasks
- Animações de entrada com hooks customizados
- Tema e internacionalização

## Screens Principais

### 1. HomeScreen
- **Localização**: `src/presentation/screens/Home/HomeScreen.tsx`
- **Propósito**: Tela principal após login
- **Funcionalidades**:
  - Dashboard de produtividade
  - Ações rápidas (Tasks, Pomodoro, Focus Mode, etc.)
  - Tarefas recentes
  - Acesso ao perfil do usuário

**Exemplo de Uso:**
```typescript
<QuickAction
  label={t("home.tasks")}
  icon={require("../../../../public/assets/images/icons/tasks.png")}
  onPress={() => navigation?.navigate?.("Tasks")}
/>
```

### 2. TasksScreen
- **Localização**: `src/presentation/screens/Tasks/TasksScreen.tsx`
- **Propósito**: Gerenciamento de tarefas
- **Funcionalidades**:
  - Lista de tarefas com prioridades
  - Subtarefas para micro-passos
  - Acompanhamento de progresso
  - Criar, editar e excluir tarefas

**Exemplo de Integração com Estatísticas:**
```typescript
<PomodoroStats
  completedSessions={stats.completedSessions}
  totalFocusTime={stats.totalFocusTime}
  testID="pomodoro-stats"
/>
```

### 3. PomodoroScreen
- **Localização**: `src/presentation/screens/Pomodoro/PomodoroScreen.tsx`
- **Propósito**: Timer Pomodoro para gestão de tempo
- **Funcionalidades**:
  - Timer circular com progresso visual
  - Controles de iniciar/pausar/resetar
  - Sessões de foco e intervalos configuráveis
  - Estatísticas de sessões completadas

### 4. Auth Screens
- **Localização**: `src/presentation/screens/Auth/`
- **Propósito**: Autenticação e registro
- **Screens**:
  - `LoginScreen.tsx`: Login com email/senha
  - `RegisterScreen.tsx`: Cadastro de novos usuários

## Padrões de Design

### ViewModel Integration

```typescript
const { loading, data, error, refresh } = useScreenViewModel();

// Estado de loading
if (loading) return <LoadingComponent />;

// Estado de erro
if (error) return <ErrorComponent error={error} />;

// Renderização normal
return <ScreenContent data={data} onRefresh={refresh} />;
```

### Navegação

```typescript
// Navegação simples
navigation?.navigate?.("ScreenName");

// Navegação com parâmetros
navigation?.navigate?.("ScreenName", { param: value });

// Navegação programática
const goToScreen = useCallback(
  () => navigation?.navigate?.("ScreenName"),
  [navigation]
);
```

### Layout Responsivo

```typescript
<ScrollView
  contentContainerStyle={{
    paddingBottom: theme.spacing.xl
  }}
  showsVerticalScrollIndicator={false}
>
  <View style={styles.section}>
    {/* Conteúdo adaptável */}
  </View>
</ScrollView>
```

### Animações de Entrada

```typescript
const { animatedStyle } = useFadeSlideInOnFocus();

return (
  <Animated.ScrollView>
    <Animated.View style={animatedStyle}>
      {/* Conteúdo animado */}
    </Animated.View>
  </Animated.ScrollView>
);
```

## Funcionalidades por Screen

### Home vs Tasks

**HomeScreen**:
- Foco em ações rápidas
- Interface resumida
- Visão geral de produtividade

**TasksScreen**:
- Gestão detalhada de tarefas
- Subtarefas e prioridades
- Progresso e estatísticas

### Estados de Carregamento

```typescript
<FlatList
  data={tasks}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <TaskItem task={item} />}
  refreshing={loading}
  onRefresh={refresh}
  scrollEnabled={false}
/>
```

### Helpers e Utilities

#### Estatísticas de Produtividade
```typescript
function buildProductivityStats(tasks: Task[], sessions: PomodoroSession[]): Stats {
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const totalFocusTime = sessions.reduce((acc, s) => acc + s.duration, 0);
  const completedSessions = sessions.length;

  return {
    completedTasks,
    totalTasks,
    completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    totalFocusTime,
    completedSessions,
  };
}
```

#### Priorização de Tarefas
```typescript
function sortTasksByPriority(tasks: Task[]): Task[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
```

## Performance e Otimização

### ScrollView vs FlatList
- **ScrollView**: Para conteúdo limitado e misto
- **FlatList**: Para listas longas com dados uniformes

### Memoization
```typescript
const styles = useMemo(() => makeScreenStyles(theme), [theme]);
const processedData = useMemo(() => processData(rawData), [rawData]);
```

### Lazy Loading
```typescript
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

## Testes

### Estrutura de Testes
```typescript
describe('HomeScreen', () => {
  beforeEach(() => {
    mockUseHomeViewModel.mockReturnValue({
      loading: false,
      tasks: mockTasks,
      stats: mockStats
    });
  });

  it('should render user greeting', () => {
    render(<HomeScreen navigation={mockNavigation} />);
    expect(screen.getByText(/hello/i)).toBeInTheDocument();
  });
});
```

## Próximos Passos

- [ ] Implementar navegação tipo-safe com React Navigation
- [ ] Adicionar mais animações de transição
- [ ] Melhorar tratamento de estados de erro
- [ ] Implementar deep linking
- [ ] Adicionar skeleton loading states
