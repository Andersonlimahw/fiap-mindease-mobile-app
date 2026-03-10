
export default {
  useMock: process.env.EXPO_PUBLIC_USE_MOCK === 'true',
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com',
    timeout: 30000,
  },
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  },
  ai: {
    ollamaUrl: process.env.EXPO_PUBLIC_AI_OLLAMA_URL || 'http://localhost:11434',
    defaultModel: process.env.EXPO_PUBLIC_AI_OLLAMA_MODEL || 'qwen2.5-coder:7b',
  },
};
