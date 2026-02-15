import { useContext, useMemo, useState } from "react";
import { ThemeContext } from "../../../utils/themes/ThemeContext";

export default function ContactsPanel({
  users,
  selectedUserId,
  onSelectUser,
  showContactsMobile,
}) {
  const { currentTheme, theme } = useContext(ThemeContext);

  // ✅ Video backgrounds are now token-theme-driven (Option A)
  const hasVideoBg = Boolean(theme?.media?.backgroundVideo);

  const [hoveredId, setHoveredId] = useState(null);
  const [pressedId, setPressedId] = useState(null);

  const t = theme;

  // --- Token-first colours with legacy fallbacks (drop-in safe) ---
  const colors = {
    panelText:
      t?.text?.primary ??
      currentTheme?.mainTextColor ??
      currentTheme?.textColor,

    headerBg: t?.surface?.header ?? currentTheme?.headerBg,
    headerText:
      t?.text?.heading ??
      currentTheme?.headerTextColor ??
      currentTheme?.mainTextColor ??
      currentTheme?.textColor,

    border:
      t?.border?.default ??
      currentTheme?.floatMenuBorder ??
      "rgba(255,255,255,0.4)",

    itemBorder:
      t?.border?.default ??
      currentTheme?.floatMenuBorder ??
      "rgba(255,255,255,0.25)",

    secondaryText: t?.text?.secondary ?? currentTheme?.grayText ?? currentTheme?.textColor,

    // State colours
    hoverBg:
      t?.action?.hover ??
      t?.action?.selected ??
      t?.surface?.interactive ??
      currentTheme?.floatMenuBgHover ??
      currentTheme?.selectedOptionButton ??
      currentTheme?.innerContainerColor ??
      currentTheme?.questionBox,

    pressedBg:
      t?.action?.selected ??
      t?.surface?.interactive ??
      currentTheme?.selectedOptionButton ??
      currentTheme?.innerContainerColor ??
      currentTheme?.questionBox,

    selectedBg:
      t?.action?.selected ??
      t?.surface?.interactive ??
      currentTheme?.innerContainerColor ??
      currentTheme?.questionBox,
  };

  // When there is a background video, render an opaque surface for the contacts panel.
  const panelBg = useMemo(() => {
    if (!hasVideoBg) {
      return (
        t?.surface?.container ??
        currentTheme?.containerColor ??
        t?.surface?.containerSubtle ??
        "#ffffff"
      );
    }

    // Prefer a neutral, opaque surface that still matches the theme.
    return (
      t?.surface?.container ??
      t?.surface?.containerSubtle ??
      t?.surface?.interactive ??
      currentTheme?.placeholderBg ??
      currentTheme?.questionBox ??
      currentTheme?.containerColor ??
      "#ffffff"
    );
  }, [hasVideoBg, t, currentTheme]);

  const panelStyle = {
    backgroundColor: panelBg, // ✅ opaque on video themes
    color: colors.panelText,
    borderColor: colors.border,
  };

  const headerStyle = {
    backgroundColor: colors.headerBg,
    color: colors.headerText,
    borderColor: colors.border,
  };

  return (
    <div
      className={[
        "border-r flex flex-col",
        "md:w-1/3 md:flex",
        "w-full",
        showContactsMobile ? "flex" : "hidden",
        "md:flex",
      ].join(" ")}
      style={panelStyle}
    >
      <h2 className="p-4 text-lg font-bold border-b" style={headerStyle}>
        Contacts
      </h2>

      <div className="flex-1 overflow-y-auto">
        {users.map((u) => {
          const isSelected = selectedUserId === u._id;
          const isHovered = hoveredId === u._id;
          const isPressed = pressedId === u._id;

          const bg =
            (isSelected && colors.selectedBg) ||
            (isPressed && colors.pressedBg) ||
            (isHovered && colors.hoverBg) ||
            "transparent";

          const itemStyle = {
            borderColor: colors.itemBorder,
            backgroundColor: bg,
          };

          return (
            <button
              type="button"
              key={u._id}
              onClick={() => onSelectUser(u)}
              onMouseEnter={() => setHoveredId(u._id)}
              onMouseLeave={() => setHoveredId(null)}
              onMouseDown={() => setPressedId(u._id)}
              onMouseUp={() => setPressedId(null)}
              onTouchStart={() => setPressedId(u._id)}
              onTouchEnd={() => setPressedId(null)}
              className="w-full text-left p-4 border-b transition-colors duration-150"
              style={itemStyle}
            >
              <p className="font-semibold" style={{ color: colors.panelText }}>
                {u.name}
              </p>
              <p className="text-sm" style={{ color: colors.secondaryText }}>
                {u.email}
              </p>
            </button>
          );
        })}

        {users.length === 0 && (
          <div className="p-6 text-sm" style={{ color: colors.secondaryText }}>
            No friends yet.
          </div>
        )}
      </div>
    </div>
  );
}
