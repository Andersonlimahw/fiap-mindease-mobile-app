import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { styles } from './AddTaskModal.styles';
import { useTheme } from '@app/presentation/theme/theme';
import { useI18n } from '@app/presentation/i18n/I18nProvider';
import { useAuth } from '@store/authStore';
import { useTasksActions } from '@store/tasksStore';
import type { Task, TaskPriority, CreateTaskInput } from '@app/domain/entities/Task';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  editingTask?: Task | null;
}

const PRIORITY_CONFIG: Record<TaskPriority, { bg: string; activeBg: string; text: string }> = {
  high: { bg: '#FEE2E2', activeBg: '#DC2626', text: '#DC2626' },
  medium: { bg: '#FEF3C7', activeBg: '#D97706', text: '#D97706' },
  low: { bg: '#DBEAFE', activeBg: '#2563EB', text: '#2563EB' },
};

export function AddTaskModal({ visible, onClose, editingTask }: AddTaskModalProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const { addTask, updateTask } = useTasksActions();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [loading, setLoading] = useState(false);

  const isEditing = !!editingTask;

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setPriority(editingTask.priority);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
    }
  }, [editingTask, visible]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !user?.id) return;

    setLoading(true);
    try {
      if (isEditing && editingTask) {
        await updateTask(editingTask.id, {
          title: title.trim(),
          description: description.trim(),
          priority,
        });
      } else {
        const input: CreateTaskInput = {
          userId: user.id,
          title: title.trim(),
          description: description.trim(),
          priority,
          completed: false,
          subTasks: [],
        };
        await addTask(input);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setLoading(false);
    }
  }, [title, description, priority, user?.id, isEditing, editingTask, addTask, updateTask, onClose]);

  const renderPriorityButton = (p: TaskPriority) => {
    const config = PRIORITY_CONFIG[p];
    const isActive = priority === p;

    return (
      <TouchableOpacity
        key={p}
        style={[
          styles.priorityButton,
          {
            backgroundColor: isActive ? config.activeBg : config.bg,
            borderColor: config.activeBg,
          },
          isActive && styles.priorityButtonActive,
        ]}
        onPress={() => setPriority(p)}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={[
            styles.priorityText,
            { color: isActive ? '#fff' : config.text },
          ]}
        >
          {t(`tasks.priority.${p}`)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />

          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {isEditing ? t('tasks.editTask') : t('tasks.addTask')}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcons name="close" size={24} color={theme.colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {t('tasks.taskTitle')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                  },
                ]}
                placeholder={t('tasks.titlePlaceholder')}
                placeholderTextColor={theme.colors.muted}
                value={title}
                onChangeText={setTitle}
                autoFocus={!isEditing}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {t('tasks.taskDescription')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                  },
                ]}
                placeholder={t('tasks.descriptionPlaceholder')}
                placeholderTextColor={theme.colors.muted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {t('tasks.taskPriority')}
              </Text>
              <View style={styles.priorityContainer}>
                {renderPriorityButton('low')}
                {renderPriorityButton('medium')}
                {renderPriorityButton('high')}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.colors.primary },
                (!title.trim() || loading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!title.trim() || loading}
            >
              <Text style={styles.submitButtonText}>
                {loading
                  ? t('common.saving')
                  : isEditing
                  ? t('common.save')
                  : t('tasks.createTask')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
