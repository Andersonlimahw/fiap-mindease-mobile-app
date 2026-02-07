/**
 * ChatMessage Entity - Domain Layer
 * Represents AI chat messages
 */

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

export type OllamaMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Demo responses for the AI assistant
export const DEMO_RESPONSES: Record<string, string> = {
  pomodoro:
    'A Técnica Pomodoro é um método de gerenciamento de tempo que divide o trabalho em intervalos de 25 minutos (chamados "pomodoros"), separados por pausas curtas. Após 4 pomodoros, você faz uma pausa mais longa. Isso ajuda a manter o foco e prevenir a fadiga mental.',

  tarefas:
    'Para organizar suas tarefas de forma eficaz:\n1. Liste todas as tarefas\n2. Divida tarefas grandes em micro-etapas menores\n3. Priorize por urgência e importância\n4. Defina prazos realistas\n5. Use o MindEase para criar e acompanhar suas tarefas!',

  ansiedade:
    'Algumas estratégias para reduzir ansiedade:\n1. Respiração profunda (4-7-8)\n2. Meditação mindfulness (5-10 min)\n3. Exercício físico regular\n4. Limite de cafeína\n5. Estabeleça uma rotina de sono\n6. Use o modo foco do MindEase para minimizar distrações',

  concentração:
    'Para melhorar sua concentração:\n1. Elimine distrações (use o Modo Foco)\n2. Trabalhe em blocos de tempo (Pomodoro)\n3. Faça pausas regulares\n4. Mantenha-se hidratado\n5. Ajuste iluminação e temperatura\n6. Pratique meditação diariamente',

  produtividade:
    'Dicas para aumentar sua produtividade:\n1. Planeje seu dia na noite anterior\n2. Comece pelas tarefas mais difíceis\n3. Use técnicas como Pomodoro\n4. Minimize multitasking\n5. Organize seu espaço de trabalho\n6. Tire pausas regulares',

  foco:
    'O Modo Foco do MindEase ajuda você a:\n1. Eliminar distrações visuais\n2. Usar sons ambiente relaxantes\n3. Bloquear notificações\n4. Manter um timer para sessões focadas\n\nExperimente ativar o Modo Foco antes de começar uma tarefa importante!',

  default:
    'Sou o assistente IA do MindEase! Posso ajudar com:\n- Técnicas de produtividade (Pomodoro)\n- Organização de tarefas\n- Gerenciamento de tempo\n- Redução de ansiedade e estresse\n- Dicas de foco e concentração\n\nComo posso ajudar você hoje?',
};

export const QUICK_QUESTIONS = [
  'O que é a técnica Pomodoro?',
  'Como organizar minhas tarefas?',
  'Dicas para reduzir ansiedade',
  'Como melhorar a concentração?',
];

export function getAIResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
    if (key !== 'default' && lowerMessage.includes(key)) {
      return response;
    }
  }

  return DEMO_RESPONSES.default;
}
