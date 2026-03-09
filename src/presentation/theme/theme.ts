// White-label dynamic theme
// Facade: re-export theme types and hooks for presentation layer
import type {
  AppTheme,
  ThemeMode,
  ThemeColors,
  BrandId,
} from "@store/themeStore";

import {
  useTheme,
  useThemeActions,
  getAvailableBrands,
  getBrandLogoText,
  getNavigationTheme,
} from "@store/themeStore";

export type { AppTheme, ThemeMode, ThemeColors, BrandId };
export {
  useTheme,
  useThemeActions,
  getAvailableBrands,
  getBrandLogoText,
  getNavigationTheme,
};
