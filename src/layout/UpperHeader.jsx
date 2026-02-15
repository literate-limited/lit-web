// src/components/UpperHeader.jsx (DROP-IN replacement)
// Fix: no useMemo caching => header recolors immediately when theme values change

import { useContext } from "react";
import { ThemeContext } from "../utils/themes/ThemeContext";

export default function UpperHeader() {
  const { theme, currentTheme } = useContext(ThemeContext);

  const tkn = theme;

  // Token-first, legacy fallback
  const bg =
    tkn?.surface?.header ??
    tkn?.surface?.container ??
    currentTheme?.headerBg ??
    "#0b1220";

  const border =
    tkn?.border?.default ??
    currentTheme?.floatMenuBorder ??
    "rgba(255,255,255,0.18)";

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[70] h-12 flex items-center"
      style={{
        backgroundColor: bg,
        borderBottom: `1px solid ${border}`,
      }}
    />
  );
}
