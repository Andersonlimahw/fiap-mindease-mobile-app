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
import { OllamaChatRepository } from "@app/data/ollama/OllamaChatRepository";
import { MockChatRepository } from "@app/data/mock/MockChatRepository";

type DIState = {
  container: Container;
  di: DI;
};

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
    container.set(TOKENS.ChatRepository, new OllamaChatRepository());
  } catch (e: any) {
    // Keep the app usable in development if Firebase env is missing/misconfigured
    // eslint-disable-next-line no-console
    console.warn("[DI] Firebase init failed, using mocks instead:", {
      error: e,
    });
    container.set(TOKENS.AuthRepository, new MockAuthRepository());
    container.set(TOKENS.FileRepository, new MockFileRepository());
    container.set(TOKENS.TaskRepository, MockTaskRepository);
    container.set(TOKENS.ChatRepository, new OllamaChatRepository());
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
