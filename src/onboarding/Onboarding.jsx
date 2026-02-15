// src/onboarding/Onboarding.jsx
// Legacy token-based onboarding route now redirects to the modern invite flow.

import { useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "../translator/hooks/useTranslation";
import { ThemeContext } from "../utils/themes/ThemeContext";
import onboardingTranslations from "./translations";

export default function Onboarding() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(onboardingTranslations);
  const { theme, currentTheme } = useContext(ThemeContext);
  const tt = (key, fallback) => {
    const value = t(key);
    return !value || value === key ? fallback : value;
  };

  useEffect(() => {
    if (token) {
      navigate(`/invite/${token}`, { replace: true });
    } else {
      navigate("/welcome", { replace: true });
    }
  }, [token, navigate]);

  const pageBg = theme?.surface?.app ?? currentTheme?.backgroundColor ?? "#0b0703";
  const cardBg = theme?.surface?.container ?? currentTheme?.headerBg ?? "#f3e7c3";
  const cardBorder = theme?.border?.default ?? currentTheme?.floatMenuBorder ?? "#b67b2c";
  const textSecondary = theme?.text?.secondary ?? currentTheme?.grayText ?? "#4a3523";
  const accent = theme?.action?.primary ?? currentTheme?.buttonColor ?? "#2a1c0f";
  const glow =
    accent && accent.startsWith("#") && accent.length === 7
      ? `${accent}55`
      : "rgba(0,0,0,0.2)";

  return (
    <section
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{ backgroundColor: pageBg }}
    >
      <div
        className="rounded-xl p-6 text-sm"
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          color: textSecondary,
          boxShadow: `0 0 35px ${glow}`,
        }}
      >
        {tt("onboarding.redirecting", "Redirecting...")}
      </div>
    </section>
  );
}
