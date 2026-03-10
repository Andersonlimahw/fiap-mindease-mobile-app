import { create } from "zustand";
import { devtools } from "zustand/middleware";
import AppConfig from "@app/config/appConfig";
import { FirebaseAPI } from "@app/infrastructure/firebase/firebase";
import { Container, TOKENS, createDI, type DI } from "@app/core/di/container";
import { MockAuthRepository } from "@app/data/mock/MockAuthRepository";
import { FirebaseAuthRepository } from "@app/data/firebase/FirebaseAuthRepository";
import { MockFileRepository } from "@app/data/mock/MockFileRepository";
import { FirebaseFileRepository } from "@app/data/firebase/FirebaseFileRepository";
import { MockTaskRepository } from "@app/data/mock/MockTaskRepository";
import { FirebaseTaskRepository } from "@app/data/firebase/FirebaseTaskRepository";
import { FirebaseChatRepository } from "@app/data/firebase/FirebaseChatRepository";
import { OllamaChatRepository } from "@app/data/ollama/OllamaChatRepository";
import { MockChatRepository } from "@app/data/mock/MockChatRepository";
import { RepositorySelector } from "@app/core/ai/RepositorySelector";
import { AIResponseSource } from "@app/types/ai";
import { ChatRepository } from "@app/domain/repositories/ChatRepository";
import { FirebaseUserRepository } from "@app/data/firebase/FirebaseUserRepository";
import { MockUserRepository } from "@app/data/mock/MockUserRepository";
import { FirebaseNotificationRepository } from "@app/data/firebase/FirebaseNotificationRepository";
import { MockNotificationRepository } from "@app/data/mock/MockNotificationRepository";
import { ChatResponse } from "@app/domain/entities/ChatMessage";

type DIState = {
  container: Container;
  di: DI;
};

function buildChatRepositoryWithSelector(): ChatRepository {
  // Criar todas as implementações disponíveis
  const repos: any = {
    [AIResponseSource.LOCAL_CACHED]: new MockChatRepository(),
    [AIResponseSource.OLLAMA]: new OllamaChatRepository(),
    [AIResponseSource.CLOUD]: new FirebaseChatRepository(),
    [AIResponseSource.FIREBASE]: new FirebaseChatRepository(),
    [AIResponseSource.MOCK]: new MockChatRepository(),
    [AIResponseSource.DEMO]: new MockChatRepository(),
    [AIResponseSource.LOCAL]: new MockChatRepository(),
  };

  const selector = new RepositorySelector(repos);

  // Armazenar seletor globalmente para debug/analytics
  (global as any).__aiRepositorySelector = selector;

  const wrappedRepo: ChatRepository = {
    async sendMessage(userId, messages, systemPrompt, onChunk) {
      const cloudRepo = repos[AIResponseSource.CLOUD];

      // 1. Get the last user message to save it
      const lastUserMsg = messages.filter(m => m.role === 'user').pop();
      if (lastUserMsg) {
        try {
          await cloudRepo.saveMessage(userId, lastUserMsg);
        } catch (e) {
          console.warn('[ChatRepository] Failed to save user message to cloud:', e);
        }
      }

      // 2. Get AI response from selector (tries Cloud, then Ollama, then Local...)
      const { response: responseText, metadata } = await selector.sendMessage(
        userId,
        messages,
        systemPrompt,
        onChunk ? (chunk) => onChunk(chunk) : undefined
      );

      // 3. Save the final AI response to Firebase for persistence
      try {
        await cloudRepo.saveMessage(userId, {
          role: 'assistant',
          content: responseText,
        });
      } catch (e) {
        console.warn('[ChatRepository] Failed to save assistant message to cloud:', e);
      }

      // Log do resultado (útil para debug)
      if (__DEV__) {
        console.log(
          `[ChatRepository] Response from ${metadata.source} (${metadata.latencyMs}ms)`,
          metadata
        );
      }

      return { content: responseText } as ChatResponse;
    },

    async saveMessage(userId, message) {
      const cloud = repos[AIResponseSource.CLOUD];
      return cloud.saveMessage(userId, message);
    },

    async getMessages(userId) {
      const cloud = repos[AIResponseSource.CLOUD];
      return cloud.getMessages(userId);
    },

    subscribe(userId, callback) {
      const cloud = repos[AIResponseSource.CLOUD];
      return cloud.subscribe(userId, callback);
    },

    async deleteMessage(id, userId) {
      const cloud = repos[AIResponseSource.CLOUD];
      return cloud.deleteMessage(id, userId);
    },

    async clearMessages(userId) {
      const cloud = repos[AIResponseSource.CLOUD];
      return cloud.clearMessages(userId);
    },
  };

  return wrappedRepo;
}

function buildContainer(): Container {
  const container = new Container();

  if (AppConfig.useMock) {
    container.set(TOKENS.AuthRepository, new MockAuthRepository());
    container.set(TOKENS.FileRepository, new MockFileRepository());
    container.set(TOKENS.TaskRepository, MockTaskRepository);
    container.set(TOKENS.ChatRepository, new MockChatRepository());
    container.set(TOKENS.UserRepository, new MockUserRepository());
    container.set(TOKENS.NotificationRepository, new MockNotificationRepository());
    return container;
  }

  try {
    FirebaseAPI.ensureFirebase();
    container.set(TOKENS.AuthRepository, new FirebaseAuthRepository());
    container.set(TOKENS.FileRepository, new FirebaseFileRepository());
    container.set(TOKENS.TaskRepository, new FirebaseTaskRepository());
    container.set(TOKENS.UserRepository, new FirebaseUserRepository());
    container.set(TOKENS.NotificationRepository, new FirebaseNotificationRepository());
    container.set(TOKENS.ChatRepository, buildChatRepositoryWithSelector());
  } catch (e: any) {
    console.warn("[DI] Firebase init failed, using mocks instead:", e);
    container.set(TOKENS.AuthRepository, new MockAuthRepository());
    container.set(TOKENS.FileRepository, new MockFileRepository());
    container.set(TOKENS.TaskRepository, MockTaskRepository);
    container.set(TOKENS.ChatRepository, new MockChatRepository());
    container.set(TOKENS.UserRepository, new MockUserRepository());
    container.set(TOKENS.NotificationRepository, new MockNotificationRepository());
  }
  return container;
}

const container = buildContainer();
const di = createDI(container);

export const useDIStore = create<DIState>()(
  devtools(() => ({ container, di }), { name: "DI" })
);

export function useDI(): DI {
  return useDIStore((s) => s.di);
}

export function getRepositorySelector(): RepositorySelector | undefined {
  return (global as any).__aiRepositorySelector;
}
