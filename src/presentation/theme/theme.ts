
import { createContext, useContext } from 'react';
import { DefaultTheme } from '@react-navigation/native';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#10B981', // emerald
    secondary: '#8B5CF6', // purple
    background: '#FFFFFF',
    text: '#111827',
    border: '#E5E7EB',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
};

export const ThemeContext = createContext(theme);

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  return theme;
};
