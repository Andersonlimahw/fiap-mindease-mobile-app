import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskItem } from '../TaskItem';
import { useTheme } from '@app/presentation/theme/theme';
import { useI18n } from '@app/presentation/i18n/I18nProvider';
import { Alert } from 'react-native';

// Mock Alert
vi.spyOn(Alert, 'alert');

// Mock dependencies
vi.mock('@app/presentation/theme/theme', () => ({
  useTheme: vi.fn(() => ({
    colors: {
      surface: '#fff',
      text: '#000',
      muted: '#666',
      primary: '#007AFF',
      success: '#4CD964',
      border: '#eee',
      background: '#f5f5f5',
    },
  })),
}));

vi.mock('@app/presentation/i18n/I18nProvider', () => ({
  useI18n: vi.fn(() => ({
    t: vi.fn((key: string) => key),
  })),
}));

const mockTask = {
  id: '1',
  userId: 'user-1',
  title: 'Test Task',
  description: 'Test Description',
  priority: 'medium' as const,
  completed: false,
  subTasks: [
    { id: 's1', title: 'Subtask 1', completed: false }
  ],
  createdAt: Date.now(),
};

describe('TaskItem Component', () => {
  const defaultProps = {
    task: mockTask,
    progress: 50,
    onToggle: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn(),
    onAddSubTask: vi.fn(),
    onToggleSubTask: vi.fn(),
    onDeleteSubTask: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task title correctly', () => {
    const { getByText } = render(<TaskItem {...defaultProps} />);
    expect(getByText('Test Task')).toBeTruthy();
  });

  it('calls onToggle when main checkbox is pressed', () => {
    const { getByRole } = render(<TaskItem {...defaultProps} />);
    const checkbox = getByRole('checkbox', { checked: false });
    fireEvent.press(checkbox);
    expect(defaultProps.onToggle).toHaveBeenCalled();
  });

  it('expands task when pressed', () => {
    const { getByText, queryByText } = render(<TaskItem {...defaultProps} />);
    
    // Actions container should not be visible initially
    expect(queryByText('common.edit')).toBeNull();
    
    // Press to expand
    fireEvent.press(getByText('Test Task'));
    
    // Actions container should now be visible
    expect(getByText('common.edit')).toBeTruthy();
    expect(getByText('common.delete')).toBeTruthy();
  });

  it('renders subtasks when expanded', () => {
    const { getByText } = render(<TaskItem {...defaultProps} />);
    fireEvent.press(getByText('Test Task'));
    expect(getByText('Subtask 1')).toBeTruthy();
  });

  it('calls onToggleSubTask when subtask checkbox is pressed', () => {
    const { getByText, getAllByRole } = render(<TaskItem {...defaultProps} />);
    fireEvent.press(getByText('Test Task'));
    
    // The first checkbox is the main one, the second one is the subtask one
    const subtaskCheckbox = getAllByRole('checkbox')[1];
    fireEvent.press(subtaskCheckbox);
    expect(defaultProps.onToggleSubTask).toHaveBeenCalledWith('s1');
  });

  it('shows delete confirmation when delete is pressed', () => {
    const { getByText } = render(<TaskItem {...defaultProps} />);
    fireEvent.press(getByText('Test Task'));
    fireEvent.press(getByText('common.delete'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'tasks.deleteConfirmTitle',
      'tasks.deleteConfirmMessage',
      expect.any(Array)
    );
  });

  it('calls onEdit when edit is pressed', () => {
    const { getByText } = render(<TaskItem {...defaultProps} />);
    fireEvent.press(getByText('Test Task'));
    fireEvent.press(getByText('common.edit'));
    expect(defaultProps.onEdit).toHaveBeenCalled();
  });

  it('adds subtask when input is filled and button pressed', () => {
    const { getByText, getByPlaceholderText, getByLabelText, getAllByRole } = render(<TaskItem {...defaultProps} />);
    fireEvent.press(getByText('Test Task'));
    
    // Toggle add subtask input
    fireEvent.press(getByText('tasks.addSubTask'));
    
    const input = getByPlaceholderText('tasks.subTaskPlaceholder');
    fireEvent.changeText(input, 'New Subtask');
    
    // Find add button - it's a TouchableOpacity wrapping a MaterialIcon
    // We can find it by its accessibility traits or just the icon if it has one
    // But let's try to find it via its surrounding View or position
    // Or better, trigger onSubmitEditing on TextInput
    fireEvent(input, 'submitEditing');
    
    expect(defaultProps.onAddSubTask).toHaveBeenCalledWith('New Subtask');
  });
});
