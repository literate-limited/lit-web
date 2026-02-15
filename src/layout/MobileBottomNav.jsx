import { useContext, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { FaHome, FaBookOpen, FaTree, FaComments, FaEllipsisH } from "react-icons/fa";
import { ThemeContext } from "../utils/themes/ThemeContext";

const navItems = (onOpenMenu) => [
  { label: "Home", to: "/", icon: <FaHome size={20} /> },
  { label: "Library", to: "/quest-log", icon: <FaBookOpen size={20} /> },
  { label: "Forest", to: "/forest", icon: <FaTree size={20} /> },
  { label: "Chat", to: "/message", icon: <FaComments size={20} /> },
  {
    label: "More",
    to: null,
    icon: <FaEllipsisH size={20} />,
    onClick: onOpenMenu,
  },
];

export default function MobileBottomNav({ onOpenMenu }) {
  const { theme, currentTheme } = useContext(ThemeContext);

  const colors = useMemo(() => {
    const bg =
      theme?.surface?.container ??
      theme?.surface?.header ??
      currentTheme?.headerBg ??
      "#f7f7f7";

    const text =
      theme?.text?.primary ??
      currentTheme?.mainTextColor ??
      currentTheme?.textColor ??
      "#0f172a";

    const active =
      theme?.action?.primary ??
      currentTheme?.buttonColor ??
      "#2563eb";

    const border =
      theme?.border?.default ??
      currentTheme?.floatMenuBorder ??
      "rgba(0,0,0,0.08)";

    return { bg, text, active, border };
  }, [theme, currentTheme]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden shadow-2xl"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderTop: `1px solid ${colors.border}`,
        paddingBottom: "max(env(safe-area-inset-bottom, 14px), 14px)",
      }}
    >
      <div className="grid grid-cols-5 h-16 px-2">
        {navItems(onOpenMenu).map((item) => {
          if (!item.to) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center justify-center text-xs font-semibold active:scale-[0.97] transition"
                style={{ color: colors.text }}
              >
                {item.icon}
                <span className="mt-1">{item.label}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center justify-center text-xs font-semibold transition",
                  isActive ? "scale-[1.02]" : "",
                ].join(" ")
              }
              style={({ isActive }) => ({
                color: isActive ? colors.active : colors.text,
              })}
            >
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
