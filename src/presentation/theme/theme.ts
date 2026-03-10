import { createContext, useContext } from 'react';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

export type ThemeMode = 'light' | 'dark';
export type BrandId = 'default' | 'mindease';

export const getBrandLogoText = (brand: BrandId) => 'MindEase';
export const getAvailableBrands = () => ['default', 'mindease'];

export const getNavigationTheme = (mode: ThemeMode) => {
  return mode === 'dark' ? DarkTheme : DefaultTheme;
};

export const theme = {
  ...DefaultTheme,
  mode: 'light' as ThemeMode,
  logoText: 'MindEase',
  colors: {
    ...DefaultTheme.colors,
    primary: '#10B981', // emerald
    secondary: '#8B5CF6', // purple
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    muted: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    error: '#EF4444',
    danger: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    accent: '#10B981',
    card: '#FFFFFF',
    cardText: '#111827',
    notification: '#F87171',
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
    full: 9999,
  },
  brand: 'default' as BrandId,
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  text: {
    h1: 32,
    h2: 24,
    h3: 20,
    body: 16,
    caption: 12,
  },
};

export type AppTheme = typeof theme;

export const ThemeContext = createContext<{
  theme: AppTheme;
  setMode: (mode: ThemeMode) => void;
}>({
  theme,
  setMode: () => { },
});

export const useTheme = () => {
  const { theme } = useContext(ThemeContext);
  return theme;
};

export const useThemeActions = () => {
  const { theme, setMode } = useContext(ThemeContext);
  const toggleMode = () => {
    setMode(theme.mode === 'light' ? 'dark' : 'light');
  };
  const setBrand = (_brand: BrandId) => {
    // Placeholder for now
  };
  return { setMode, toggleMode, setBrand };
};
