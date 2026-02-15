import Constants from "expo-constants";

// Tipos
type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket: string;
  messagingSenderId: string;
  databaseURL: string;
};

type AIRepositoryType = 'torch' | 'ollama' | 'firebase' | 'mock';

type AIConfigType = {
  // Primary repository selection strategy
  primaryRepository: AIRepositoryType;
  
  // Fallback chain (tried in order if primary fails)
  fallbackRepositories: AIRepositoryType[];
  
  // Torch-specific config
  torch: {
    enabled: boolean;
    modelName: string;
    modelUrl: string;
    cacheDir: string;
    maxInputLength: number;
    timeout: number; // ms
  };
  
  // Ollama config
  ollama: {
    url: string;
    model: string;
    timeout: number; // ms
  };
  
  // Response timeout per repository (ms)
  timeouts: {
    torch: number;
    ollama: number;
    firebase: number;
    demo: number;
  };
};

type AppConfigType = {
  // App info
  appName: string;
  appSlug: string;
  appScheme: string;
  version: string;
  bundleIdentifier: string;
  androidPackage: string;
  projectId: string;

  // Firebase
  firebase: FirebaseConfig;

  // AI Configuration
  ai: AIConfigType;

  // Feature flags
  useMock: boolean;
  isDevelopment: boolean;
};

/**
 * Obtém uma variável de ambiente, tentando diferentes fontes
 * 1. process.env (variáveis de ambiente em tempo de build)
 * 2. Constants.expoConfig.extra (variáveis do app.config.js/ts)
 * 3. Valor padrão fornecido
 */
const getEnv = (key: string, defaultValue: string = ''): string => {
  // Tenta obter do process.env (para desenvolvimento e build)
  const envKey = `EXPO_PUBLIC_${key}`;
  const envValue = process.env[envKey];

  if (envValue !== undefined && envValue !== '') {
    return envValue;
  }

  // Tenta obter do expo constants (para runtime)
  const extra = Constants.expoConfig?.extra || {};
  const extraValue = extra[`EXPO_PUBLIC_${key}`] || extra[key];

  if (extraValue !== undefined && extraValue !== '') {
    return String(extraValue);
  }

  // Para firebase, tenta obter do objeto firebase em extra
  if (key.startsWith('FIREBASE_')) {
    const firebaseKey = key.replace('FIREBASE_', '').toLowerCase();
    const firebaseValue = extra.firebase?.[firebaseKey];

    if (firebaseValue !== undefined && firebaseValue !== '') {
      return String(firebaseValue);
    }
  }

  // Retorna o valor padrão se fornecido
  if (defaultValue !== undefined) {
    return defaultValue;
  }

  // Em desenvolvimento, alerta sobre variáveis ausentes
  if (__DEV__) {
    console.warn(`Variável de ambiente EXPO_PUBLIC_${key} não encontrada`);
  }

  return '';
};

// Valida se as configurações obrigatórias do Firebase estão presentes
const validateFirebaseConfig = (config: FirebaseConfig): void => {
  const requiredKeys: (keyof FirebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !config[key]);

  if (missingKeys.length > 0 && !__DEV__) {
    console.error(
      `Configuração do Firebase incompleta. Chaves ausentes: ${missingKeys.join(', ')}`
    );
  }
};

// Validação e configuração de IA
const getPrimaryAIRepository = (): AIRepositoryType => {
  const value = getEnv('AI_PRIMARY_REPOSITORY', 'firebase');
  if (['torch', 'ollama', 'firebase', 'mock'].includes(value)) {
    return value as AIRepositoryType;
  }
  return 'firebase';
};

const aiConfig: AIConfigType = {
  primaryRepository: getPrimaryAIRepository(),
  fallbackRepositories: ['demo'], // Will be filled dynamically
  
  torch: {
    enabled: getEnv('AI_TORCH_ENABLED', 'true') === 'true',
    modelName: getEnv('AI_TORCH_MODEL', 'distilbert-base-multilingual-cased'),
    modelUrl: getEnv('AI_TORCH_MODEL_URL', 'https://models.example.com/distilbert.pt'),
    cacheDir: 'torch-models',
    maxInputLength: 512,
    timeout: 3000, // 3s for local inference
  },
  
  ollama: {
    url: getEnv('AI_OLLAMA_URL', getEnv('OLLAMA_URL', 'http://localhost:11434')),
    model: getEnv('AI_OLLAMA_MODEL', 'llama3'),
    timeout: 30000, // 30s for Ollama
  },
  
  timeouts: {
    torch: 3000,   // Local on-device
    ollama: 30000, // Local/Dev server
    firebase: 10000, // Cloud function
    demo: 1000,    // Demo responses
  },
};

// Build fallback chain based on primary selection
if (!__DEV__ && !getEnv('USE_MOCK', 'false').includes('true')) {
  // Production: torch → firebase → demo
  aiConfig.fallbackRepositories = ['firebase', 'mock'];
  if (!aiConfig.torch.enabled) {
    aiConfig.primaryRepository = 'firebase';
  }
} else {
  // Development: torch → ollama → firebase → demo
  aiConfig.fallbackRepositories = ['ollama', 'firebase', 'mock'];
}

// Configuração da aplicação
const AppConfig: AppConfigType = {
  // App info
  appName: getEnv('APP_NAME', 'MindEase'),
  appSlug: getEnv('APP_SLUG', 'mindease-app'),
  appScheme: getEnv('APP_SCHEME', 'mindease'),
  version: getEnv('APP_VERSION', '1.0.1'),
  bundleIdentifier: getEnv('BUNDLE_IDENTIFIER', 'com.mindease.ios'),
  androidPackage: getEnv('ANDROID_PACKAGE', 'com.mindease.android'),
  projectId: getEnv('PROJECT_ID', ''),

  // Firebase
  firebase: firebaseConfig,

  // AI Configuration
  ai: aiConfig,

  // Feature flags
  useMock: getEnv('USE_MOCK', 'false') === 'true',
  isDevelopment: __DEV__
};

// Exporta a configuração
export default AppConfig;

export type { AIConfigType, AIRepositoryType };

// Log das configurações carregadas (apenas em desenvolvimento)
if (__DEV__) {
  console.log('Configurações carregadas:', {
    ...AppConfig,
    firebase: {
      ...AppConfig.firebase,
      apiKey: AppConfig.firebase.apiKey ? '***' : 'undefined',
    },
  });
}
