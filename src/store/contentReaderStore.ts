import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as Speech from 'expo-speech';
import type { ContentItem, ContentViewMode } from '@app/domain/entities/ContentItem';
import { zustandSecureStorage } from '@app/infrastructure/storage/SecureStorage';

type ContentReaderState = {
  // Current content
  currentContent: ContentItem | null;
  viewMode: ContentViewMode;

  // Text-to-Speech state
  isSpeaking: boolean;
  speechRate: number;

  // Sample contents for demo
  sampleContents: ContentItem[];

  // Actions
  setContent: (content: ContentItem | null) => void;
  setViewMode: (mode: ContentViewMode) => void;
  toggleViewMode: () => void;
  startSpeaking: (text: string) => Promise<void>;
  stopSpeaking: () => Promise<void>;
  setSpeechRate: (rate: number) => void;
};

const STORAGE_KEY = '@mindease/content-reader:v1';

// Sample content for demonstration
const SAMPLE_CONTENTS: ContentItem[] = [
  {
    id: '1',
    title: 'The Power of Mindfulness',
    summary: 'Mindfulness is the practice of being fully present in the moment. It helps reduce stress and improve focus by training your mind to observe thoughts without judgment.',
    fullContent: `Mindfulness is the practice of being fully present in the moment, aware of where we are and what we're doing, without being overly reactive or overwhelmed by what's happening around us.

The benefits of mindfulness are extensive and well-documented. Regular practice can help reduce stress and anxiety, improve focus and concentration, enhance emotional regulation, and even boost immune function.

To begin practicing mindfulness, start with simple breathing exercises. Find a quiet spot, sit comfortably, and focus on your breath. Notice the sensation of air entering and leaving your body. When your mind wanders, gently bring your attention back to your breathing.

With consistent practice, you'll develop greater awareness and presence in your daily life, leading to improved well-being and mental clarity.`,
    readTimeMinutes: 3,
    category: 'Wellness',
    createdAt: Date.now(),
  },
  {
    id: '2',
    title: 'Productivity Tips for Developers',
    summary: 'Maximize your coding efficiency with time-blocking, the Pomodoro technique, and strategic breaks. Focus on deep work sessions to achieve flow state.',
    fullContent: `Productivity for developers isn't just about writing more code faster—it's about working smarter and maintaining sustainable output over time.

Time-blocking is a powerful technique where you dedicate specific blocks of time to particular tasks. This helps minimize context switching, which is one of the biggest productivity killers for developers.

The Pomodoro Technique works exceptionally well for coding. Work in focused 25-minute sessions followed by 5-minute breaks. After four sessions, take a longer 15-30 minute break. This rhythm helps maintain focus while preventing burnout.

Strategic breaks are crucial. Step away from your screen, stretch, or take a short walk. These breaks actually boost productivity by giving your brain time to process information and reset.

Finally, aim for flow state—that magical zone where coding feels effortless. Minimize distractions, have clear goals, and challenge yourself appropriately to enter and maintain flow.`,
    readTimeMinutes: 4,
    category: 'Productivity',
    createdAt: Date.now() - 86400000,
  },
  {
    id: '3',
    title: 'Building Healthy Habits',
    summary: 'Start small, be consistent, and stack habits to build lasting routines. Focus on systems over goals for sustainable personal growth.',
    fullContent: `Building healthy habits is less about willpower and more about designing systems that make good behaviors easier and bad behaviors harder.

Start incredibly small. If you want to exercise more, begin with just 5 minutes a day. The goal isn't to get fit in a week—it's to establish the habit of showing up consistently.

Habit stacking is a powerful technique. Attach new habits to existing routines. For example: "After I pour my morning coffee, I will meditate for 2 minutes." This leverages the power of existing neural pathways.

Environment design matters more than motivation. Keep healthy snacks visible and accessible. Put your running shoes by the door. Remove friction from good habits and add friction to bad ones.

Track your progress, but don't break the chain. Missing one day won't ruin your habit, but missing two in a row starts to form a new pattern. If you miss a day, get back on track immediately.

Finally, focus on identity-based habits. Don't just aim to "read more"—become "a reader." When your habits align with your identity, they become part of who you are, not just what you do.`,
    readTimeMinutes: 5,
    category: 'Self-improvement',
    createdAt: Date.now() - 172800000,
  },
];

export const useContentReaderStore = create<ContentReaderState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentContent: null,
      viewMode: 'summary',
      isSpeaking: false,
      speechRate: 1.0,
      sampleContents: SAMPLE_CONTENTS,

      setContent: (content) => {
        // Stop any ongoing speech when changing content
        if (get().isSpeaking) {
          Speech.stop();
          set({ isSpeaking: false });
        }
        set({ currentContent: content, viewMode: 'summary' });
      },

      setViewMode: (mode) => set({ viewMode: mode }),

      toggleViewMode: () => {
        const { viewMode, isSpeaking } = get();
        // Stop speech when switching modes
        if (isSpeaking) {
          Speech.stop();
          set({ isSpeaking: false });
        }
        set({ viewMode: viewMode === 'summary' ? 'detailed' : 'summary' });
      },

      startSpeaking: async (text) => {
        const { speechRate, isSpeaking } = get();

        // Stop any ongoing speech first
        if (isSpeaking) {
          await Speech.stop();
        }

        set({ isSpeaking: true });

        Speech.speak(text, {
          rate: speechRate,
          onDone: () => set({ isSpeaking: false }),
          onStopped: () => set({ isSpeaking: false }),
          onError: () => set({ isSpeaking: false }),
        });
      },

      stopSpeaking: async () => {
        await Speech.stop();
        set({ isSpeaking: false });
      },

      setSpeechRate: (rate) => set({ speechRate: rate }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => zustandSecureStorage),
      partialize: (state) => ({
        speechRate: state.speechRate,
      }),
    }
  )
);

// ============================================
// SELECTORS (optimized for performance)
// ============================================

export const useCurrentContent = () => useContentReaderStore((s) => s.currentContent);
export const useViewMode = () => useContentReaderStore((s) => s.viewMode);
export const useIsSpeaking = () => useContentReaderStore((s) => s.isSpeaking);
export const useSpeechRate = () => useContentReaderStore((s) => s.speechRate);
export const useSampleContents = () => useContentReaderStore((s) => s.sampleContents);

export const useContentReaderActions = () =>
  useContentReaderStore((s) => ({
    setContent: s.setContent,
    setViewMode: s.setViewMode,
    toggleViewMode: s.toggleViewMode,
    startSpeaking: s.startSpeaking,
    stopSpeaking: s.stopSpeaking,
    setSpeechRate: s.setSpeechRate,
  }));
