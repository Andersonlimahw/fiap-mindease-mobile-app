import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatMessage } from '@app/domain/entities/ChatMessage';
import { getAIResponse } from '@app/domain/entities/ChatMessage';
import { zustandSecureStorage } from '@app/infrastructure/storage/SecureStorage';

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

        set((state) => ({
          messages: [...state.messages, userMessage],
          isLoading: true,
        }));

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

        // Get AI response
        const responseContent = getAIResponse(content);

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: responseContent,
          timestamp: Date.now(),
        };

        set((state) => ({
          messages: [...state.messages, assistantMessage],
          isLoading: false,
        }));
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
