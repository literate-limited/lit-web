// src/onboarding/steps/NeedsStep.jsx
// Step 1: Select how you want to use the app (social, learning, or both)

import { useContext, useMemo, useState } from "react";
import axios from "axios";
import { Circles } from "react-loader-spinner";
import { useTranslation } from "../../translator/hooks/useTranslation";
import { ThemeContext } from "../../utils/themes/ThemeContext";
import onboardingTranslations from "../translations";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const OPTIONS = [
  {
    id: "social",
    icon: "👥",
    titleKey: "onboarding.needs.social.title",
    title: "Social",
    descriptionKey: "onboarding.needs.social.description",
    description: "Connect with friends, chat, and share moments",
    needs: ["social"],
  },
  {
    id: "learning",
    icon: "📚",
    titleKey: "onboarding.needs.learning.title",
    title: "Learning",
    descriptionKey: "onboarding.needs.learning.description",
    description: "Learn languages, take lessons, and improve skills",
    needs: ["learning"],
  },
  {
    id: "both",
    icon: "🔥",
    titleKey: "onboarding.needs.both.title",
    title: "Both",
    descriptionKey: "onboarding.needs.both.description",
    description: "The full experience - social and learning",
    needs: ["social", "learning"],
  },
];

export default function NeedsStep({ userData, onComplete, currentTheme, brandName }) {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(onboardingTranslations);
  const tt = (key, fallback) => {
    const value = t(key);
    return !value || value === key ? fallback : value;
  };

  const appName = brandName || "Lit";
  const options = useMemo(
    () =>
      OPTIONS.map((option) =>
        option.id === "both"
          ? {
              ...option,
              description: `The full ${appName} experience - social and learning`,
            }
          : option
      ),
    [appName]
  );

  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authToken = localStorage.getItem("token");

  const handleSubmit = async () => {
    if (!selected) return;

    const option = options.find((o) => o.id === selected);
    if (!option) return;

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        `${API_URL}/onboarding/needs`,
        { needs: option.needs },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (data.success) {
        onComplete(data.nextStage);
      } else {
        setError(data.message || "Failed to save selection.");
        setLoading(false);
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message);
      setLoading(false);
    }
  };

  const textPrimary = theme?.text?.primary ?? currentTheme?.mainTextColor ?? "#2a1c0f";
  const textSecondary = theme?.text?.secondary ?? currentTheme?.grayText ?? "#4a3523";
  const accent = theme?.action?.primary ?? currentTheme?.buttonColor ?? "#2a1c0f";
  const border = theme?.border?.default ?? currentTheme?.floatMenuBorder ?? "#b67b2c";
  const surfaceSelected = theme?.surface?.interactive ?? currentTheme?.innerContainerColor ?? "#f7edd1";
  const surface = theme?.surface?.containerSubtle ?? currentTheme?.placeholderBg ?? "#ffffff";
  const inverseText = theme?.text?.inverse ?? currentTheme?.buttonText ?? "#f3e7c3";
  const glow =
    accent && accent.startsWith("#") && accent.length === 7
      ? `${accent}55`
      : "rgba(0,0,0,0.2)";

  return (
    <div className="max-w-lg w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🔥</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: textPrimary }}>
          {tt("onboarding.needs.title", `Welcome to ${appName}!`)}
        </h1>
        <p className="opacity-80" style={{ color: textSecondary }}>
          {tt(
            "onboarding.needs.subtitle",
            `${appName} is a social media platform and a learning platform.`
          )}
          <br />
          {tt("onboarding.needs.question", `How would you like to use ${appName}?`)}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((option) => {
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              onClick={() => setSelected(option.id)}
              className="w-full p-4 rounded-xl border-2 text-left transition-all hover:opacity-90"
              style={{
                borderColor: isSelected ? accent : border,
                backgroundColor: isSelected ? surfaceSelected : surface,
              }}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{option.icon}</span>
                <div>
                  <h3 className="font-semibold" style={{ color: textPrimary }}>
                    {tt(option.titleKey, option.title)}
                  </h3>
                  <p className="text-sm opacity-70" style={{ color: textSecondary }}>
                    {tt(option.descriptionKey, option.description)}
                  </p>
                </div>
                {isSelected && (
                  <span className="ml-auto text-xl" style={{ color: accent }}>✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Info about choice */}
      {selected && (
        <p className="text-center text-sm opacity-70 mb-4" style={{ color: textSecondary }}>
          {selected === "social"
            ? tt(
                "onboarding.needs.helper.social",
                "You can always add learning features later in settings."
              )
            : selected === "learning"
            ? tt(
                "onboarding.needs.helper.learning",
                "You can always add social features later in settings."
              )
            : tt("onboarding.needs.helper.both", "You'll have access to all features!")}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="text-center text-red-500 text-sm mb-4">{error}</div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!selected || loading}
        className="w-full py-3 rounded-full font-semibold shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
        style={{ backgroundColor: accent, color: inverseText, boxShadow: `0 0 20px ${glow}` }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Circles height="20" width="20" color={inverseText} />
            {tt("onboarding.needs.saving", "Saving...")}
          </span>
        ) : (
          tt("onboarding.needs.continue", "Continue")
        )}
      </button>
    </div>
  );
}
