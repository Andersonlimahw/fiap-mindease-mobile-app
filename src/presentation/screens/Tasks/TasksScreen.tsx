import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { MaterialIcons } from '@expo/vector-icons';

import { styles } from './TasksScreen.styles';
import { useTheme } from '@app/presentation/theme/theme';
import { useI18n } from '@app/presentation/i18n/I18nProvider';
import { useAuth } from '@store/authStore';
import {
  useTasks,
  useTasksLoading,
  useTasksActions,
  getTaskProgress,
} from '@store/tasksStore';
import type { Task, TaskPriority } from '@app/domain/entities/Task';

import { TaskItem } from '@app/presentation/components/TaskItem';
import { AddTaskModal } from '@app/presentation/components/AddTaskModal';

type FilterType = 'all' | 'pending' | 'completed';

export function TasksScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const tasks = useTasks();
  const loading = useTasksLoading();
  const { fetchTasks, toggleTask, deleteTask, addSubTask, toggleSubTask, deleteSubTask } = useTasksActions();

  const [filter, setFilter] = useState<FilterType>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchTasks(user.id);
    }
  }, [user?.id, fetchTasks]);

  const filteredTasks = React.useMemo(() => {
    let filtered = tasks;

    if (filter === 'pending') {
      filtered = tasks.filter((t) => !t.completed);
    } else if (filter === 'completed') {
      filtered = tasks.filter((t) => t.completed);
    }

    // Sort by priority (high first), then by date (newest first)
    return filtered.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.createdAt - a.createdAt;
    });
  }, [tasks, filter]);

  const stats = React.useMemo(() => {
    const pending = tasks.filter((t) => !t.completed).length;
    const completed = tasks.filter((t) => t.completed).length;
    return { pending, completed, total: tasks.length };
  }, [tasks]);

  const handleToggleTask = useCallback((id: string) => {
    toggleTask(id);
  }, [toggleTask]);

  const handleDeleteTask = useCallback((id: string) => {
    deleteTask(id);
  }, [deleteTask]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setModalVisible(true);
  }, []);

  const handleAddSubTask = useCallback((taskId: string, title: string) => {
    addSubTask(taskId, title);
  }, [addSubTask]);

  const handleToggleSubTask = useCallback((taskId: string, subTaskId: string) => {
    toggleSubTask(taskId, subTaskId);
  }, [toggleSubTask]);

  const handleDeleteSubTask = useCallback((taskId: string, subTaskId: string) => {
    deleteSubTask(taskId, subTaskId);
  }, [deleteSubTask]);

  const handleOpenAddModal = useCallback(() => {
    setEditingTask(null);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setEditingTask(null);
  }, []);

  const renderFilterButton = (type: FilterType, label: string) => {
    const isActive = filter === type;
    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          { borderColor: theme.colors.border },
          isActive && [
            styles.filterButtonActive,
            { backgroundColor: theme.colors.primary },
          ],
        ]}
        onPress={() => setFilter(type)}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={[
            styles.filterText,
            { color: isActive ? '#fff' : theme.colors.muted },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons
        name="check-circle-outline"
        size={64}
        color={theme.colors.muted}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {filter === 'completed'
          ? t('tasks.noCompletedTasks')
          : t('tasks.noTasks')}
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.muted }]}>
        {filter === 'completed'
          ? t('tasks.completeTasksToSeeHere')
          : t('tasks.addFirstTask')}
      </Text>
    </View>
  );

  const renderTask = useCallback(
    ({ item }: { item: Task }) => (
      <TaskItem
        task={item}
        progress={getTaskProgress(item)}
        onToggle={() => handleToggleTask(item.id)}
        onDelete={() => handleDeleteTask(item.id)}
        onEdit={() => handleEditTask(item)}
        onAddSubTask={(title) => handleAddSubTask(item.id, title)}
        onToggleSubTask={(subTaskId) => handleToggleSubTask(item.id, subTaskId)}
        onDeleteSubTask={(subTaskId) => handleDeleteSubTask(item.id, subTaskId)}
      />
    ),
    [handleToggleTask, handleDeleteTask, handleEditTask, handleAddSubTask, handleToggleSubTask, handleDeleteSubTask]
  );

  if (loading && tasks.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('tasks.title')}
        </Text>
        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, { color: theme.colors.muted }]}>
            {stats.completed}/{stats.total}
          </Text>
          <MaterialIcons
            name="check-circle"
            size={20}
            color={theme.colors.success}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('all', t('tasks.filterAll'))}
        {renderFilterButton('pending', t('tasks.filterPending'))}
        {renderFilterButton('completed', t('tasks.filterCompleted'))}
      </View>

      <View style={styles.content}>
        <FlashList
          data={filteredTasks}
          renderItem={renderTask}
          estimatedItemSize={120}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          keyExtractor={(item) => item.id}
        />
      </View>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleOpenAddModal}
        accessibilityRole="button"
        accessibilityLabel={t('tasks.addTask')}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <AddTaskModal
        visible={modalVisible}
        onClose={handleCloseModal}
        editingTask={editingTask}
      />
    </SafeAreaView>
  );
}
