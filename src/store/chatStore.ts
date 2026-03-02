import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatMessage } from '@app/domain/entities/ChatMessage';
import type { ChatRepository } from '@app/domain/repositories/ChatRepository';
import { getAIResponse } from '@app/domain/entities/ChatMessage';
import { zustandSecureStorage } from '@app/infrastructure/storage/SecureStorage';
import { useDIStore } from '@app/store/diStore';
import { useAuthStore } from '@app/store/authStore';
import { TOKENS } from '@app/core/di/container';

const SYSTEM_PROMPT =
  'Você é o assistente IA do MindEase, um app de produtividade e bem-estar. ' +
  'Ajude com: técnicas Pomodoro, organização de tarefas, foco, gerenciamento de tempo, redução de ansiedade. ' +
  'Responda de forma concisa e amigável em português. Limite respostas a 3-4 parágrafos.';

type ChatState = {
  messages: ChatMessage[];
  isLoading: boolean;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
};

const STORAGE_KEY = '@mindease/chat:v1';
const MAX_MESSAGES = 50;

let messageIdCounter = 1;

const generateId = (): string => {
  return `msg-${Date.now()}-${messageIdCounter++}`;
};

function getChatRepository(): ChatRepository | null {
  try {
    return useDIStore.getState().di.resolve<ChatRepository>(TOKENS.ChatRepository);
  } catch {
    return null;
  }
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,

      sendMessage: async (content: string) => {
        // Add user message
        const userMessage: ChatMessage = {
          id: generateId(),
          role: 'user',
          content,
          timestamp: Date.now(),
        };

        const assistantMessageId = generateId();
        const initialAssistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        };

        set((state) => ({
          messages: [...state.messages, userMessage, initialAssistantMessage],
          isLoading: true,
        }));

        let finalResponseContent: string = '';

        const repo = getChatRepository();
        const user = useAuthStore.getState().user;
        const userId = user?.id || 'anonymous';

        if (repo) {
          try {
            // Send context excluding the recently added empty assistant message
            const allMessages = get().messages.filter(m => m.id !== assistantMessageId);

            const result = await repo.sendMessage(userId, allMessages, SYSTEM_PROMPT, (chunk) => {
              set((state) => {
                const messages = [...state.messages];
                const lastMsgIndex = messages.findIndex(m => m.id === assistantMessageId);
                if (lastMsgIndex !== -1) {
                  const updatedMsg = { ...messages[lastMsgIndex] };
                  updatedMsg.content += chunk;
                  finalResponseContent = updatedMsg.content;
                  messages[lastMsgIndex] = updatedMsg;
                }
                return { messages };
              });
            });

            finalResponseContent = result.content;
          } catch {
            // Fallback to demo responses if all repositories fail
            finalResponseContent = getAIResponse(content);
          }
        } else {
          // No repository available — use demo responses with simulated delay
          await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));
          finalResponseContent = getAIResponse(content);
        }

        set((state) => {
          const messages = [...state.messages];
          const lastMsgIndex = messages.findIndex(m => m.id === assistantMessageId);
          if (lastMsgIndex !== -1) {
            messages[lastMsgIndex] = {
              ...messages[lastMsgIndex],
              content: finalResponseContent,
            };
          }
          return {
            messages,
            isLoading: false,
          };
        });
      },

      clearHistory: () => {
        set({ messages: [], isLoading: false });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => zustandSecureStorage),
      partialize: (state) => ({
        // Keep only last N messages
        messages: state.messages.slice(-MAX_MESSAGES),
      }),
    }
  )
);

// ============================================
// SELECTORS (optimized for performance)
// ============================================

export const useChatMessages = () => useChatStore((s) => s.messages);
export const useChatIsLoading = () => useChatStore((s) => s.isLoading);

export const useChatActions = () =>
  useChatStore((s) => ({
    sendMessage: s.sendMessage,
    clearHistory: s.clearHistory,
  }));
