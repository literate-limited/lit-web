import { useContext } from "react";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { useBrand } from "../brands/BrandContext";

export default function ProfessorOnboarding({ invite, onDone }) {
  const { theme, currentTheme } = useContext(ThemeContext);
  const { brand } = useBrand();
  const appName = brand?.name || "Lit";

  const pageBg = theme?.surface?.app ?? currentTheme?.backgroundColor ?? "#0b0703";
  const cardBg = theme?.surface?.container ?? currentTheme?.headerBg ?? "#f3e7c3";
  const cardBorder = theme?.border?.default ?? currentTheme?.floatMenuBorder ?? "#b67b2c";
  const textPrimary = theme?.text?.primary ?? currentTheme?.mainTextColor ?? "#2a1c0f";
  const textSecondary = theme?.text?.secondary ?? currentTheme?.grayText ?? "#4a3523";
  const accent = theme?.action?.primary ?? currentTheme?.buttonColor ?? "#2a1c0f";
  const inverseText = theme?.text?.inverse ?? currentTheme?.buttonText ?? "#f3e7c3";
  const glow =
    accent && accent.startsWith("#") && accent.length === 7
      ? `${accent}55`
      : "rgba(0,0,0,0.2)";

  return (
    <section
      className="min-h-screen w-full flex items-center justify-center p-6 relative"
      style={{ backgroundColor: pageBg, color: textPrimary }}
    >
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-2xl">
        <div
          className="rounded-xl p-6 sm:p-7"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, boxShadow: `0 0 35px ${glow}` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <img className="h-12 w-12" src={brand?.logo} alt={appName} />
            <div>
              <div className="text-xl font-bold">Instructor Access</div>
              <div className="text-sm opacity-70" style={{ color: textSecondary }}>
                You are all set to teach.
              </div>
            </div>
          </div>
          <div className="text-sm opacity-80 mb-6" style={{ color: textSecondary }}>
            You have been granted instructor privileges in {appName}. Teaching tools will appear here once
            your account is fully activated.
          </div>

          <button
            type="button"
            onClick={onDone}
            className="px-6 py-3 rounded-full font-semibold shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
            style={{ backgroundColor: accent, color: inverseText, boxShadow: `0 0 20px ${glow}` }}
          >
            Continue
          </button>
        </div>
      </div>
    </section>
  );
}
