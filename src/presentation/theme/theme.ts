import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useThemeStore, useTheme as useStoreTheme, useThemeActions as useStoreThemeActions, getNavigationTheme as getStoreNavigationTheme } from '../../store/themeStore';

export type { ThemeMode, BrandId, AppTheme } from '../../store/themeStore';

export const getBrandLogoText = (brand: any) => 'MindEase';
export const getAvailableBrands = () => ['default', 'mindease'];

export const getNavigationTheme = (theme: any) => {
  // If it's just a string 'dark' or 'light', fallback to simple logic
  if (typeof theme === 'string') {
    return theme === 'dark' ? DarkTheme : DefaultTheme;
  }
  // Otherwise, use the robust version from themeStore
  return getStoreNavigationTheme(theme);
};

// We export the hooks that use the Zustand store
export const useTheme = () => {
  return useStoreTheme();
};

export const useThemeActions = () => {
  return useStoreThemeActions();
};


