import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { styles } from './ChatScreen.styles';
import { useTheme } from '@app/presentation/theme/theme';
import { useI18n } from '@app/presentation/i18n/I18nProvider';
import { useChatMessages, useChatIsLoading, useChatActions } from '@store/chatStore';
import { QUICK_QUESTIONS } from '@app/domain/entities/ChatMessage';
import type { ChatMessage } from '@app/domain/entities/ChatMessage';

const CHAT_COLOR = '#10B981'; // Green for chat

function TypingIndicator({ color }: { color: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);
  }, [dot1, dot2, dot3]);

  const dots = [dot1, dot2, dot3].map((dot, index) => (
    <Animated.View
      key={index}
      style={[
        styles.typingDot,
        {
          backgroundColor: color,
          opacity: dot.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
          transform: [
            {
              scale: dot.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2],
              }),
            },
          ],
        },
      ]}
    />
  ));

  return <>{dots}</>;
}

export function ChatScreen() {
  const theme = useTheme();
  const { t } = useI18n();

  const messages = useChatMessages();
  const isLoading = useChatIsLoading();
  const { sendMessage, clearHistory } = useChatActions();

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;

    const text = inputText.trim();
    setInputText('');
    await sendMessage(text);
  }, [inputText, isLoading, sendMessage]);

  const handleQuickQuestion = useCallback(
    async (question: string) => {
      if (isLoading) return;
      await sendMessage(question);
    },
    [isLoading, sendMessage]
  );

  const handleClearHistory = useCallback(() => {
    Alert.alert(
      t('chat.clearConfirmTitle'),
      t('chat.clearConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: clearHistory,
        },
      ]
    );
  }, [t, clearHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isUser = item.role === 'user';

      return (
        <View
          style={[
            styles.messageBubble,
            isUser
              ? [styles.userBubble, { backgroundColor: CHAT_COLOR }]
              : [styles.assistantBubble, { backgroundColor: theme.colors.surface }],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? '#fff' : theme.colors.text },
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              { color: isUser ? 'rgba(255,255,255,0.7)' : theme.colors.muted },
            ]}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      );
    },
    [theme]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons
        name="chat-bubble-outline"
        size={64}
        color={theme.colors.muted}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {t('chat.title')}
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.muted }]}>
        Ask me anything about productivity, focus, and time management!
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && { flex: 1 },
          ]}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            isLoading ? (
              <View
                style={[
                  styles.typingIndicator,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <TypingIndicator color={CHAT_COLOR} />
              </View>
            ) : null
          }
        />

        {/* Quick Questions */}
        {messages.length === 0 && (
          <View
            style={[
              styles.quickQuestionsContainer,
              { borderTopColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.quickQuestionsTitle, { color: theme.colors.muted }]}>
              {t('chat.quickQuestions')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickQuestionsScroll}
            >
              {QUICK_QUESTIONS.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quickQuestionButton,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => handleQuickQuestion(question)}
                >
                  <Text style={[styles.quickQuestionText, { color: theme.colors.text }]}>
                    {question}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Area */}
        <View
          style={[
            styles.inputContainer,
            { borderTopColor: theme.colors.border },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
              },
            ]}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={theme.colors.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: CHAT_COLOR },
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <MaterialIcons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Clear Button in Header */}
      {messages.length > 0 && (
        <TouchableOpacity
          style={[styles.clearButton, { position: 'absolute', top: 10, right: 16 }]}
          onPress={handleClearHistory}
        >
          <MaterialIcons name="delete-outline" size={24} color={theme.colors.muted} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
