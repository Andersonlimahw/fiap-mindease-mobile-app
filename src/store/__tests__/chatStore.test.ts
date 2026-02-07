/**
 * Unit Tests for chatStore
 * Tests Chat state management and message handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatStore } from '../chatStore';
import { useDIStore } from '@store/diStore';
import { TOKENS } from '@app/core/di/container';

// Helper to configure the mock DI to return a specific ChatRepository
function mockChatRepository(repo: {
  sendMessage: ReturnType<typeof vi.fn>;
} | null) {
  vi.mocked(useDIStore.getState).mockReturnValue({
    di: {
      resolve: vi.fn((token: unknown) => {
        if (token === TOKENS.ChatRepository) return repo;
        return undefined;
      }),
    },
  } as any);
}

describe('chatStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useChatStore.setState({
      messages: [],
      isLoading: false,
    });
    // Default: no repository (tests fallback/demo path)
    mockChatRepository(null);
  });

  describe('initial state', () => {
    it('should have empty messages array', () => {
      const state = useChatStore.getState();
      expect(state.messages).toEqual([]);
    });

    it('should not be loading initially', () => {
      const state = useChatStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('sendMessage action', () => {
    it('should add user message to messages array', async () => {
      const { sendMessage } = useChatStore.getState();

      // Don't await - we want to check intermediate state
      const promise = sendMessage('Hello');

      // Check that user message was added immediately
      const state = useChatStore.getState();
      expect(state.messages.length).toBe(1);
      expect(state.messages[0].role).toBe('user');
      expect(state.messages[0].content).toBe('Hello');

      await promise;
    });

    it('should set isLoading to true while processing', async () => {
      const { sendMessage } = useChatStore.getState();

      const promise = sendMessage('Test message');

      // Should be loading while processing
      expect(useChatStore.getState().isLoading).toBe(true);

      await promise;

      // Should stop loading after completion
      expect(useChatStore.getState().isLoading).toBe(false);
    });

    it('should add assistant response after user message', async () => {
      const { sendMessage } = useChatStore.getState();

      await sendMessage('Olá');

      const state = useChatStore.getState();
      expect(state.messages.length).toBe(2);
      expect(state.messages[0].role).toBe('user');
      expect(state.messages[1].role).toBe('assistant');
    });

    it('should generate unique message IDs', async () => {
      const { sendMessage } = useChatStore.getState();

      await sendMessage('Message 1');
      await sendMessage('Message 2');

      const state = useChatStore.getState();
      const ids = state.messages.map((m) => m.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include timestamp in messages', async () => {
      const beforeSend = Date.now();

      const { sendMessage } = useChatStore.getState();
      await sendMessage('Test');

      const afterSend = Date.now();
      const state = useChatStore.getState();

      state.messages.forEach((msg) => {
        expect(msg.timestamp).toBeGreaterThanOrEqual(beforeSend);
        expect(msg.timestamp).toBeLessThanOrEqual(afterSend + 2000); // Allow for async delay
      });
    });
  });

  describe('clearHistory action', () => {
    it('should clear all messages', async () => {
      // Add some messages first
      const { sendMessage } = useChatStore.getState();
      await sendMessage('Test 1');
      await sendMessage('Test 2');

      expect(useChatStore.getState().messages.length).toBe(4); // 2 user + 2 assistant

      // Clear history
      useChatStore.getState().clearHistory();

      const state = useChatStore.getState();
      expect(state.messages).toEqual([]);
      expect(state.isLoading).toBe(false);
    });

    it('should reset loading state when clearing', () => {
      useChatStore.setState({ isLoading: true, messages: [] });

      useChatStore.getState().clearHistory();

      expect(useChatStore.getState().isLoading).toBe(false);
    });
  });

  describe('message structure', () => {
    it('should have correct message interface', async () => {
      const { sendMessage } = useChatStore.getState();
      await sendMessage('Hello');

      const message = useChatStore.getState().messages[0];

      expect(message).toHaveProperty('id');
      expect(message).toHaveProperty('role');
      expect(message).toHaveProperty('content');
      expect(message).toHaveProperty('timestamp');

      expect(typeof message.id).toBe('string');
      expect(['user', 'assistant']).toContain(message.role);
      expect(typeof message.content).toBe('string');
      expect(typeof message.timestamp).toBe('number');
    });
  });

  describe('conversation flow', () => {
    it('should maintain message order', async () => {
      const { sendMessage } = useChatStore.getState();

      await sendMessage('First');
      await sendMessage('Second');
      await sendMessage('Third');

      const messages = useChatStore.getState().messages;

      // Should alternate user/assistant
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('First');
      expect(messages[1].role).toBe('assistant');
      expect(messages[2].role).toBe('user');
      expect(messages[2].content).toBe('Second');
      expect(messages[3].role).toBe('assistant');
      expect(messages[4].role).toBe('user');
      expect(messages[4].content).toBe('Third');
      expect(messages[5].role).toBe('assistant');
    });

    it('should handle multiple concurrent sends gracefully', async () => {
      const { sendMessage } = useChatStore.getState();

      // Send multiple messages without waiting
      const promises = [
        sendMessage('Msg 1'),
        sendMessage('Msg 2'),
        sendMessage('Msg 3'),
      ];

      await Promise.all(promises);

      const messages = useChatStore.getState().messages;

      // All messages should be added
      expect(messages.length).toBe(6); // 3 user + 3 assistant
    });
  });

  describe('AI response generation', () => {
    it('should respond to greetings', async () => {
      const { sendMessage } = useChatStore.getState();
      await sendMessage('olá');

      const response = useChatStore.getState().messages[1];
      expect(response.role).toBe('assistant');
      expect(response.content.length).toBeGreaterThan(0);
    });

    it('should respond to focus-related queries', async () => {
      const { sendMessage } = useChatStore.getState();
      await sendMessage('como melhorar meu foco?');

      const response = useChatStore.getState().messages[1];
      expect(response.role).toBe('assistant');
      expect(response.content.length).toBeGreaterThan(0);
    });

    it('should respond to pomodoro-related queries', async () => {
      const { sendMessage } = useChatStore.getState();
      await sendMessage('o que é pomodoro?');

      const response = useChatStore.getState().messages[1];
      expect(response.role).toBe('assistant');
      expect(response.content.length).toBeGreaterThan(0);
    });

    it('should respond to task-related queries', async () => {
      const { sendMessage } = useChatStore.getState();
      await sendMessage('como organizar minhas tarefas?');

      const response = useChatStore.getState().messages[1];
      expect(response.role).toBe('assistant');
      expect(response.content.length).toBeGreaterThan(0);
    });
  });

  describe('ChatRepository integration', () => {
    it('should use repository response when available', async () => {
      const mockRepo = {
        sendMessage: vi.fn().mockResolvedValue({
          content: 'Resposta real do Ollama',
        }),
      };
      mockChatRepository(mockRepo);

      const { sendMessage } = useChatStore.getState();
      await sendMessage('Teste com Ollama');

      const state = useChatStore.getState();
      expect(state.messages.length).toBe(2);
      expect(state.messages[1].content).toBe('Resposta real do Ollama');
      expect(mockRepo.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should pass message history and system prompt to repository', async () => {
      const mockRepo = {
        sendMessage: vi.fn().mockResolvedValue({
          content: 'OK',
        }),
      };
      mockChatRepository(mockRepo);

      const { sendMessage } = useChatStore.getState();
      await sendMessage('Primeira pergunta');

      const call = mockRepo.sendMessage.mock.calls[0];
      // First argument: messages array (should include the user message)
      expect(call[0]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'Primeira pergunta' }),
        ])
      );
      // Second argument: system prompt string
      expect(typeof call[1]).toBe('string');
      expect(call[1]).toContain('MindEase');
    });

    it('should fallback to demo response when repository throws', async () => {
      const mockRepo = {
        sendMessage: vi.fn().mockRejectedValue(new Error('Network error')),
      };
      mockChatRepository(mockRepo);

      const { sendMessage } = useChatStore.getState();
      await sendMessage('pomodoro');

      const state = useChatStore.getState();
      expect(state.messages.length).toBe(2);
      expect(state.messages[1].role).toBe('assistant');
      // Should get demo response, not empty
      expect(state.messages[1].content.length).toBeGreaterThan(0);
      expect(state.isLoading).toBe(false);
    });

    it('should fallback to demo response when no repository is registered', async () => {
      mockChatRepository(null);

      const { sendMessage } = useChatStore.getState();
      await sendMessage('foco');

      const state = useChatStore.getState();
      expect(state.messages.length).toBe(2);
      expect(state.messages[1].role).toBe('assistant');
      expect(state.messages[1].content.length).toBeGreaterThan(0);
    });

    it('should set isLoading false even when repository throws', async () => {
      const mockRepo = {
        sendMessage: vi.fn().mockRejectedValue(new Error('Timeout')),
      };
      mockChatRepository(mockRepo);

      const { sendMessage } = useChatStore.getState();
      await sendMessage('test');

      expect(useChatStore.getState().isLoading).toBe(false);
    });
  });
});
