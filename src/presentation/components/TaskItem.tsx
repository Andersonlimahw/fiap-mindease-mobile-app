import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { styles } from './TaskItem.styles';
import { useTheme } from '@app/presentation/theme/theme';
import { useI18n } from '@app/presentation/i18n/I18nProvider';
import type { Task, SubTask, TaskPriority } from '@app/domain/entities/Task';

interface TaskItemProps {
  task: Task;
  progress: number;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onAddSubTask: (title: string) => void;
  onToggleSubTask: (subTaskId: string) => void;
  onDeleteSubTask: (subTaskId: string) => void;
}

const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string }> = {
  high: { bg: '#FEE2E2', text: '#DC2626' },
  medium: { bg: '#FEF3C7', text: '#D97706' },
  low: { bg: '#DBEAFE', text: '#2563EB' },
};

export function TaskItem({
  task,
  progress,
  onToggle,
  onDelete,
  onEdit,
  onAddSubTask,
  onToggleSubTask,
  onDeleteSubTask,
}: TaskItemProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const [showAddSubTask, setShowAddSubTask] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [expanded, setExpanded] = useState(false);

  const priorityColors = PRIORITY_COLORS[task.priority];

  const handleAddSubTask = useCallback(() => {
    if (newSubTaskTitle.trim()) {
      onAddSubTask(newSubTaskTitle.trim());
      setNewSubTaskTitle('');
      setShowAddSubTask(false);
    }
  }, [newSubTaskTitle, onAddSubTask]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      t('tasks.deleteConfirmTitle'),
      t('tasks.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  }, [t, onDelete]);

  const renderSubTask = useCallback(
    (subTask: SubTask) => (
      <View key={subTask.id} style={styles.subTaskItem}>
        <TouchableOpacity
          style={[
            styles.subTaskCheckbox,
            { borderColor: theme.colors.border },
            subTask.completed && { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
          ]}
          onPress={() => onToggleSubTask(subTask.id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: subTask.completed }}
        >
          {subTask.completed && (
            <MaterialIcons name="check" size={12} color="#fff" />
          )}
        </TouchableOpacity>
        <Text
          style={[
            styles.subTaskText,
            { color: theme.colors.text },
            subTask.completed && styles.subTaskCompleted,
          ]}
        >
          {subTask.title}
        </Text>
        <TouchableOpacity
          style={styles.subTaskDeleteButton}
          onPress={() => onDeleteSubTask(subTask.id)}
          accessibilityLabel={t('tasks.deleteSubTask')}
        >
          <MaterialIcons name="close" size={16} color={theme.colors.muted} />
        </TouchableOpacity>
      </View>
    ),
    [theme, onToggleSubTask, onDeleteSubTask, t]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity
        style={styles.mainContent}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              { borderColor: theme.colors.primary },
              task.completed && [
                styles.checkboxCompleted,
                { backgroundColor: theme.colors.success },
              ],
            ]}
            onPress={onToggle}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: task.completed }}
          >
            {task.completed && (
              <MaterialIcons name="check" size={16} color="#fff" />
            )}
          </TouchableOpacity>

          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  { color: theme.colors.text },
                  task.completed && styles.titleCompleted,
                ]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: priorityColors.bg },
                ]}
              >
                <Text style={[styles.priorityText, { color: priorityColors.text }]}>
                  {t(`tasks.priority.${task.priority}`)}
                </Text>
              </View>
            </View>

            {task.description ? (
              <Text
                style={[styles.description, { color: theme.colors.muted }]}
                numberOfLines={expanded ? undefined : 2}
              >
                {task.description}
              </Text>
            ) : null}

            {task.subTasks.length > 0 && (
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: theme.colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${progress}%`,
                        backgroundColor: theme.colors.success,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: theme.colors.muted }]}>
                  {progress}% {t('tasks.completed')}
                </Text>
              </View>
            )}
          </View>

          <MaterialIcons
            name={expanded ? 'expand-less' : 'expand-more'}
            size={24}
            color={theme.colors.muted}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.mainContent, { paddingTop: 0 }]}>
          {task.subTasks.length > 0 && (
            <View
              style={[
                styles.subTasksContainer,
                { borderTopColor: theme.colors.border },
              ]}
            >
              <View style={styles.subTasksHeader}>
                <Text style={[styles.subTasksTitle, { color: theme.colors.muted }]}>
                  {t('tasks.subTasks')} ({task.subTasks.length})
                </Text>
                <TouchableOpacity
                  style={styles.addSubTaskButton}
                  onPress={() => setShowAddSubTask(!showAddSubTask)}
                >
                  <MaterialIcons
                    name="add"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.addSubTaskText, { color: theme.colors.primary }]}>
                    {t('tasks.addSubTask')}
                  </Text>
                </TouchableOpacity>
              </View>

              {task.subTasks.map(renderSubTask)}
            </View>
          )}

          {(showAddSubTask || task.subTasks.length === 0) && (
            <View style={styles.addSubTaskInput}>
              <TextInput
                style={[
                  styles.subTaskInputField,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                  },
                ]}
                placeholder={t('tasks.subTaskPlaceholder')}
                placeholderTextColor={theme.colors.muted}
                value={newSubTaskTitle}
                onChangeText={setNewSubTaskTitle}
                onSubmitEditing={handleAddSubTask}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[
                  styles.subTaskInputButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleAddSubTask}
                disabled={!newSubTaskTitle.trim()}
              >
                <MaterialIcons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          <View
            style={[
              styles.actionsContainer,
              { borderTopColor: theme.colors.border },
            ]}
          >
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background }]}
              onPress={onEdit}
            >
              <MaterialIcons name="edit" size={16} color={theme.colors.primary} />
              <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                {t('common.edit')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FEE2E2' }]}
              onPress={handleDelete}
            >
              <MaterialIcons name="delete" size={16} color="#DC2626" />
              <Text style={[styles.actionText, { color: '#DC2626' }]}>
                {t('common.delete')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
