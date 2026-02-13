# Componentes

Este documento descreve como os componentes estão implementados no aplicativo MindEase, incluindo sua arquitetura, padrões e exemplos de uso.

## Arquitetura de Componentes

### Estrutura de Arquivos

Os componentes estão organizados em `src/presentation/components/` seguindo a seguinte estrutura:

```
src/presentation/components/
├── ComponentName.tsx          # Implementação do componente
├── ComponentName.styles.ts    # Estilos separados quando necessário
├── ComponentName.hook.ts      # Hooks customizados relacionados
└── charts/                    # Subpasta para componentes específicos
    └── ChartComponent.tsx
```

### Padrões de Implementação

#### 1. Componentes com Styled Components

**Exemplo: Button.tsx**

```typescript
import React, { useMemo, useRef } from 'react';
import { useTheme } from '@presentation/theme/theme';
import { makeButtonStyles } from '@components/Button.styles';

type Props = {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
};

export const Button: React.FC<Props> = ({
  title, onPress, style, disabled, loading
}) => {
  const theme = useTheme();
  const styles = useMemo(() => makeButtonStyles(theme), [theme]);
  // ... implementação
};
```

**Características:**
- Usa `useTheme()` para consistência visual
- Estilos separados em arquivos `.styles.ts`
- Props tipadas com TypeScript
- Suporte a animações com `Animated`

#### 2. Componentes Complexos com Hooks

**Exemplo: FileUploader.tsx**

```typescript
export const FileUploader: React.FC<FileUploaderProps> = ({
  mode, recordId, onStagedChange, maxFiles = 10
}) => {
  const fileUploaderHook = useFileUploader();
  const fileVM = useFileViewModel();

  // Lógica complexa delegada para hooks customizados
  const pickFiles = useCallback(async () => {
    const granted = await fileUploaderHook.ensureMediaPermissions();
    // ... resto da implementação
  }, [fileUploaderHook]);
```

**Características:**
- Separação de responsabilidades com hooks customizados
- Gerenciamento de estado complexo
- Integração com ViewModels
- Suporte a diferentes modos de operação

## Componentes Principais

### 1. Button
- **Localização**: `src/presentation/components/Button.tsx`
- **Propósito**: Botão padrão com animações e estados
- **Features**: Loading state, disabled state, animação de press

### 2. FileUploader
- **Localização**: `src/presentation/components/FileUploader.tsx`
- **Propósito**: Upload e gerenciamento de arquivos
- **Modos**:
  - `staged`: Coleta arquivos antes de existir um registro persistido
  - `bound`: Gerencia uploads já vinculados a um registro salvo

### 3. TaskItem
- **Localização**: `src/presentation/components/TaskItem.tsx`
- **Propósito**: Item de lista para tarefas com prioridades e subtarefas
- **Features**: Indicadores de prioridade, ações rápidas

### 4. Avatar
- **Localização**: `src/presentation/components/Avatar.tsx`
- **Propósito**: Exibição de foto de usuário ou iniciais
- **Features**: Fallback para iniciais, tamanhos configuráveis

### 5. QuickAction
- **Localização**: `src/presentation/components/QuickAction.tsx`
- **Propósito**: Ações rápidas na home
- **Features**: Ícones, labels, navegação

## Padrões de Design

### Tema e Estilização

```typescript
const theme = useTheme();
const styles = useMemo(() => makeComponentStyles(theme), [theme]);
```

- Todos os componentes usam o hook `useTheme()`
- Estilos são memoizados para performance
- Consistência visual através do theme global

### Internacionalização

```typescript
const { t } = useI18n();

<Text>{t('component.label')}</Text>
```

- Uso obrigatório do hook `useI18n()`
- Textos sempre externalizados
- Suporte a múltiplos idiomas

### Acessibilidade

```typescript
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel={t('component.accessibilityLabel')}
  accessibilityHint={t('component.hint')}
>
```

- Props de acessibilidade sempre definidas
- Labels e hints internacionalizados
- Suporte a leitores de tela

### Animações

```typescript
const scale = useRef(new Animated.Value(1)).current;

const pressIn = () => {
  Animated.spring(scale, {
    toValue: 0.98,
    useNativeDriver: true
  }).start();
};
```

- Uso de `useNativeDriver: true` para performance
- Animações sutis e consistentes
- Spring animations para naturalidade

## Testes

Os componentes seguem padrões de teste baseados em:
- Snapshot testing para regressões visuais
- Testes de comportamento com `@testing-library/react-native`
- Mocks para dependências externas

## Considerações de Performance

1. **Memoization**: Uso de `useMemo` para estilos e computações
2. **Lazy Loading**: Componentes grandes carregados sob demanda
3. **Native Driver**: Animações otimizadas
4. **FlatList**: Para listas longas com virtualização

## Próximos Passos

- [ ] Adicionar mais componentes de UI base
- [ ] Implementar design system mais robusto
- [ ] Melhorar cobertura de testes
- [ ] Documentar hooks customizados
