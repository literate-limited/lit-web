// src/admin/AdminFloatingControls.jsx
import { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../utils/themes/ThemeContext";

export default function AdminFloatingControls({
  adminAsUserView,
  setAdminAsUserView,
}) {
  const navigate = useNavigate();
  const { theme, currentTheme } = useContext(ThemeContext);

  const colors = useMemo(() => {
    const bg =
      theme?.surface?.interactive ??
      theme?.surface?.menu ??
      currentTheme?.floatMenuBg ??
      "rgba(0,0,0,0.75)";

    const text =
      theme?.text?.inverse ??
      currentTheme?.buttonText ??
      currentTheme?.floatMenuText ??
      "#fff";

    const border =
      theme?.border?.default ??
      currentTheme?.floatMenuBorder ??
      "rgba(255,255,255,0.25)";

    const btnBg =
      theme?.action?.primary ??
      currentTheme?.playbuttonColor ??
      "#0ea5e9";

    const btnBg2 =
      theme?.surface?.header ??
      currentTheme?.headerBg ??
      "rgba(255,255,255,0.18)";

    return { bg, text, border, btnBg, btnBg2 };
  }, [theme, currentTheme]);

  const goDashboard = () => {
    // If you're in User Preview, flip back to Admin view *first*
    if (typeof setAdminAsUserView === "function") {
      setAdminAsUserView(false);
    }
    navigate("/admin-dashboard");
  };

  return (
    <div className="fixed bottom-4 right-4 z-[999] pointer-events-none">
      <div
        className="pointer-events-auto rounded-2xl shadow-xl border backdrop-blur px-2 py-2 flex items-center gap-2"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          borderColor: colors.border,
        }}
      >
        <button
          type="button"
          onClick={() => setAdminAsUserView((v) => !v)}
          className="px-3 py-2 rounded-xl text-xs font-semibold shadow active:scale-[0.98] transition-transform whitespace-nowrap"
          style={{
            backgroundColor: colors.btnBg,
            color: colors.text,
          }}
          title={
            adminAsUserView
              ? "Currently previewing as a normal user"
              : "Currently in admin view"
          }
        >
          {adminAsUserView ? "👁 User Preview" : "🛠 Admin View"}
        </button>

        <button
          type="button"
          onClick={goDashboard}
          className="px-3 py-2 rounded-xl text-xs font-semibold shadow active:scale-[0.98] transition-transform whitespace-nowrap"
          style={{
            backgroundColor: colors.btnBg2,
            color: colors.text,
          }}
          title="Go to Admin Dashboard"
        >
          🧭 Dashboard
        </button>
      </div>
    </div>
  );
}
