import type { ChatRepository } from '@app/domain/repositories/ChatRepository';
import type {
  ChatMessage,
  ChatResponse,
} from '@app/domain/entities/ChatMessage';
import { FirebaseAPI } from '@app/infrastructure/firebase/firebase';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from '@react-native-firebase/firestore';

const COLLECTION_NAME = 'chatMessages';

/**
 * Firebase implementation of ChatRepository
 * Stores and retrieves chat message history for users
 * Falls back to demo responses if needed
 */
export class FirebaseChatRepository implements ChatRepository {
  private getDb() {
    return FirebaseAPI.db ?? getFirestore();
  }

  private parseChatMessage(id: string, data: any): ChatMessage {
    const timestamp = data.timestamp?.toMillis
      ? data.timestamp.toMillis()
      : Number(data.timestamp) || Date.now();

    return {
      id,
      role: data.role,
      content: data.content,
      timestamp,
    };
  }

  /**
   * Send a message to the chat (store in Firebase)
   * In a real scenario, this would integrate with an AI service via Cloud Functions
   */
  async sendMessage(
    userId: string,
    messages: ChatMessage[],
    _systemPrompt: string
  ): Promise<ChatResponse> {
    const db = this.getDb();

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Extract the last user message
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop();

    if (!lastUserMsg) {
      throw new Error('No user message found');
    }

    // Store user message in Firebase
    await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      role: 'user',
      content: lastUserMsg.content,
      timestamp: serverTimestamp(),
    });

    // For now, return a demo response
    // In production, call a Cloud Function to get AI response
    const demoResponse = this.getDemoResponse(lastUserMsg.content);

    // Store assistant response in Firebase
    const assistantDocRef = await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      role: 'assistant',
      content: demoResponse,
      timestamp: serverTimestamp(),
    });

    return {
      content: demoResponse,
    };
  }

  /**
   * Get all chat messages for a user
   */
  async getMessages(userId: string): Promise<ChatMessage[]> {
    const db = this.getDb();
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('timestamp', 'asc')
    );

    const snap = await getDocs(q);
    return snap?.docs.map((d: any) => this.parseChatMessage(d.id, d.data())) || [];
  }

  /**
   * Subscribe to real-time chat messages
   */
  subscribe(
    userId: string,
    callback: (messages: ChatMessage[]) => void
  ): () => void {
    const db = this.getDb();
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snap: any) => {
      const messages =
        snap?.docs.map((d: any) => this.parseChatMessage(d.id, d.data())) || [];
      callback(messages);
    });

    return unsub;
  }

  /**
   * Delete a message
   */
  async deleteMessage(id: string): Promise<void> {
    const db = this.getDb();
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }

  /**
   * Clear all messages for a user
   */
  async clearMessages(userId: string): Promise<void> {
    const db = this.getDb();
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));

    const snap = await getDocs(q);
    for (const doc_ of snap.docs) {
      await deleteDoc(doc_.ref);
    }
  }

  /**
   * Demo response based on keywords
   */
  private getDemoResponse(message: string): string {
    const DEMO_RESPONSES: Record<string, string> = {
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

    const lowerMessage = message.toLowerCase();

    for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
      if (key !== 'default' && lowerMessage.includes(key)) {
        return response;
      }
    }

    return DEMO_RESPONSES.default;
  }
}
