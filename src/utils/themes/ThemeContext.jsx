// src/themes/ThemeContext.jsx
import { createContext, useMemo } from "react";
import { themes as legacyThemes } from "./themes.utils";
import { themes as tokenThemes } from "./themes";
import { useBrand } from "../../brands/BrandContext";

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { brandId, brand } = useBrand();

  // ✅ IMPORTANT: theme changes when orb changes
  const themeKey = brand?.theme ?? brandId ?? "lit";

  const currentTheme = legacyThemes[themeKey] ?? legacyThemes.classic;
  const theme = tokenThemes[themeKey] ?? tokenThemes.lit;

  const value = useMemo(
    () => ({ currentTheme, theme, themeKey }),
    [themeKey] // ✅ only needs themeKey
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
