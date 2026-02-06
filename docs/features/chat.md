# AI Chat Feature

## Overview

An AI-powered chat assistant that provides productivity guidance, tips, and support. Currently operates in demo mode with predefined responses, with architecture prepared for Ollama API integration.

## Architecture

### Domain Layer

#### Entity: ChatMessage

```typescript
// src/domain/entities/ChatMessage.ts

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type SendMessageInput = {
  content: string;
};

export interface ChatResponse {
  content: string;
  confidence?: number;
}
```

#### Repository Interface

```typescript
// src/domain/repositories/ChatRepository.ts

export interface ChatRepository {
  getHistory(userId: string, limit?: number): Promise<ChatMessage[]>;
  sendMessage(userId: string, content: string): Promise<ChatMessage>;
  clearHistory(userId: string): Promise<void>;
}
```

### Store

```typescript
// src/store/chatStore.ts

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  loadHistory: () => Promise<void>;
}
```

### Presentation

#### Screen: ChatScreen

Location: `src/presentation/screens/Chat/ChatScreen.tsx`

Components:
- ChatMessageList (FlashList of messages)
- ChatBubble (message bubble with role-based styling)
- ChatInput (text input with send button)
- QuickQuestions (predefined question buttons)
- LoadingIndicator (typing animation)

## Demo Responses

Pre-programmed responses for common topics:

```typescript
const demoResponses: Record<string, string> = {
  'pomodoro': 'A Técnica Pomodoro divide o trabalho em intervalos de 25 minutos...',
  'tarefas': 'Para organizar suas tarefas de forma eficaz: 1. Liste todas...',
  'ansiedade': 'Algumas estratégias para reduzir ansiedade: 1. Respiração...',
  'concentração': 'Para melhorar sua concentração: 1. Elimine distrações...',
  'default': 'Sou o assistente IA do MindEase! Posso ajudar com...',
};
```

## Quick Questions

Suggested questions for easy interaction:

```typescript
const quickQuestions = [
  'O que é a técnica Pomodoro?',
  'Como organizar minhas tarefas?',
  'Dicas para reduzir ansiedade',
  'Como melhorar a concentração?',
];
```

## User Stories

1. As a user, I can send text messages to the AI
2. As a user, I see AI responses to my questions
3. As a user, I can use quick question buttons
4. As a user, I see a typing indicator while AI processes
5. As a user, I can view my chat history
6. As a user, I can clear chat history
7. As a user, my messages are persisted across sessions

## Future: Ollama Integration

Architecture prepared for real AI integration:

```typescript
// src/data/api/OllamaChatRepository.ts

export class OllamaChatRepository implements ChatRepository {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async sendMessage(userId: string, content: string): Promise<ChatMessage> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama2',
        prompt: content,
        stream: false,
      }),
    });

    const data = await response.json();

    return {
      id: `ai-${Date.now()}`,
      role: 'assistant',
      content: data.response,
      timestamp: Date.now(),
    };
  }
}
```

## UI/UX Considerations

- Messages aligned based on role (user right, assistant left)
- Smooth scroll to bottom on new messages
- Input field always visible with keyboard
- Loading animation during AI response
- Error handling with retry option
- Accessible with screen readers

## Data Persistence

- Messages stored locally with limit (last 50 messages)
- Uses Zustand persist with MMKV storage

## Migration Notes

Web source: `.tmp/fiap-mindease-frontend-web/src/stores/useChatStore.ts`

Key differences:
- Replace `crypto.randomUUID()` with uuid or timestamp
- Use MMKV instead of localStorage
- Add proper keyboard handling for React Native
- Consider using KeyboardAvoidingView
