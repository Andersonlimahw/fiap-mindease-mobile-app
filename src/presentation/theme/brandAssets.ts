import type { BrandId, ThemeMode } from "@store/themeStore";
import type { ImageSourcePropType } from "react-native";

type BrandLogos = Record<
  BrandId,
  Partial<Record<ThemeMode, ImageSourcePropType>>
>;

// Map static assets per brand/mode. When an entry is missing, the UI gracefully
// falls back to using `theme.logoText` instead of an image.
export const brandLogos: BrandLogos = {
  mindease: {
    light: require("../../../public/assets/images/icons/Logo.png"),
  },
  neon: {
    // Provide a logo if available; otherwise the UI will render the brand name
  },
};
