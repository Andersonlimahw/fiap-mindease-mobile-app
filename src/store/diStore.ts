import { create } from "zustand";
import { devtools } from "zustand/middleware";
import AppConfig from "@app/config/appConfig";
import { FirebaseAPI } from "@app/infrastructure/firebase/firebase";
import { Container, TOKENS, createDI, type DI } from "@app/core/di/container";
import { MockAuthRepository } from "@app/data/mock/MockAuthRepository";
import { GoogleAuthRepository as FirebaseAuthRepository } from "@app/data/google/GoogleAuthRepository";
import { MockFileRepository } from "@app/data/mock/MockFileRepository";
import { FirebaseFileRepository } from "@app/data/firebase/FirebaseFileRepository";
import { MockTaskRepository } from "@app/data/mock/MockTaskRepository";
import { FirebaseTaskRepository } from "@app/data/firebase/FirebaseTaskRepository";
import { FirebaseChatRepository } from "@app/data/firebase/FirebaseChatRepository";
import { OllamaChatRepository } from "@app/data/ollama/OllamaChatRepository";
import { TorchChatRepository } from "@app/data/torch/TorchChatRepository";
import { MockChatRepository } from "@app/data/mock/MockChatRepository";
import { RepositorySelector } from "@app/core/ai/RepositorySelector";
import type { AIResponseSource } from "@app/types/ai";
import { AIResponseSource as ResponseSource } from "@app/types/ai";
import type { ChatRepository } from "@app/domain/repositories/ChatRepository";

type DIState = {
  container: Container;
  di: DI;
};

function buildChatRepositoryWithSelector(): ChatRepository {
  // Criar todas as implementações disponíveis
  const repos: Record<AIResponseSource, ChatRepository> = {
    [ResponseSource.LOCAL]: new TorchChatRepository(),
    [ResponseSource.LOCAL_CACHED]: new MockChatRepository(), // Placeholder para cache
    [ResponseSource.OLLAMA]: new OllamaChatRepository(),
    [ResponseSource.CLOUD]: new FirebaseChatRepository(),
    [ResponseSource.DEMO]: new MockChatRepository(),
  };

  // Criar seletor com as implementações
  const selector = new RepositorySelector(repos);

  // Armazenar seletor globalmente para debug/analytics
  (global as any).__aiRepositorySelector = selector;

  // Criar wrapper que usa o seletor
  const wrappedRepo: ChatRepository = {
    async sendMessage(userId, messages, systemPrompt) {
      const { response, metadata } = await selector.sendMessage(userId, messages, systemPrompt);
      
      // Log do resultado (útil para debug)
      if (__DEV__) {
        console.log(
          `[ChatRepository] Response from ${metadata.source} (${metadata.latencyMs}ms)`,
          metadata
        );
      }
      
      return response;
    },

    async getMessages(userId) {
      const cloud = repos[ResponseSource.CLOUD];
      return cloud.getMessages(userId);
    },

    subscribe(userId, callback) {
      const cloud = repos[ResponseSource.CLOUD];
      return cloud.subscribe(userId, callback);
    },

    async deleteMessage(id) {
      const cloud = repos[ResponseSource.CLOUD];
      return cloud.deleteMessage(id);
    },

    async clearMessages(userId) {
      const cloud = repos[ResponseSource.CLOUD];
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
    return container;
  }

  // In real mode, try to init Firebase; if it fails, gracefully fallback to mocks
  try {
    FirebaseAPI.ensureFirebase();
    // Autenticação via GoogleSignin (sem firebase/auth)
    container.set(TOKENS.AuthRepository, new FirebaseAuthRepository());
    container.set(TOKENS.FileRepository, new FirebaseFileRepository());
    container.set(TOKENS.TaskRepository, new FirebaseTaskRepository());
    
    // Chat com estratégia inteligente de seleção
    container.set(TOKENS.ChatRepository, buildChatRepositoryWithSelector());
  } catch (e: any) {
    // Keep the app usable in development if Firebase env is missing/misconfigured
    // eslint-disable-next-line no-console
    console.warn("[DI] Firebase init failed, using mocks instead:", {
      error: e,
    });
    container.set(TOKENS.AuthRepository, new MockAuthRepository());
    container.set(TOKENS.FileRepository, new MockFileRepository());
    container.set(TOKENS.TaskRepository, MockTaskRepository);
    container.set(TOKENS.ChatRepository, new MockChatRepository());
  }
  return container;
}

const container = buildContainer();
const di = createDI(container);

export const useDIStore = create<DIState>()(
  devtools(() => ({ container, di }), { name: "DI" })
);

export function useDI(): DI {
  type S = ReturnType<typeof useDIStore.getState>;
  return useDIStore((s: S) => s.di);
}

/**
 * Útil para debug - obter seletor de repositório
 */
export function getRepositorySelector(): RepositorySelector | undefined {
  return (global as any).__aiRepositorySelector;
}

