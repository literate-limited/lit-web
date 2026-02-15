// src/onboarding/steps/NativeLanguageStep.jsx
// Step 2: Select your native language

import { useContext, useState } from "react";
import axios from "axios";
import { Circles } from "react-loader-spinner";
import { useTranslation } from "../../translator/hooks/useTranslation";
import { ThemeContext } from "../../utils/themes/ThemeContext";
import onboardingTranslations from "../translations";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// Comprehensive language list
const LANGUAGES = [
  { code: "en", name: "English", flag: "/flags/uk.svg" },
  { code: "es", name: "Español", flag: "/flags/spain.svg" },
  { code: "fr", name: "Français", flag: "/flags/france.svg" },
  { code: "de", name: "Deutsch", flag: "/flags/germany.svg" },
  { code: "hi", name: "हिन्दी (Hindi)", flag: "/flags/india.svg" },
  { code: "zh", name: "中文 (Chinese)", flag: "/flags/china.svg" },
  { code: "ja", name: "日本語 (Japanese)", flag: "/flags/japan.svg" },
  { code: "ko", name: "한국어 (Korean)", flag: "/flags/korea.svg" },
  { code: "pt", name: "Português", flag: "/flags/portugal.svg" },
  { code: "it", name: "Italiano", flag: "/flags/italy.svg" },
  { code: "ru", name: "Русский (Russian)", flag: "/flags/russia.svg" },
  { code: "ar", name: "العربية (Arabic)", flag: "/flags/saudi-arabia.svg" },
];

export default function NativeLanguageStep({ userData, onComplete, currentTheme, currentLang }) {
  const { theme } = useContext(ThemeContext);
  const { t } = useTranslation(onboardingTranslations);
  const tt = (key, fallback) => {
    const value = t(key);
    return !value || value === key ? fallback : value;
  };

  // Pre-select based on current UI language or existing native language
  const preferredLang = userData?.nativeLanguage || currentLang || null;
  const defaultLang = LANGUAGES.some((l) => l.code === preferredLang) ? preferredLang : null;
  const [selected, setSelected] = useState(defaultLang);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authToken = localStorage.getItem("token");

  const handleSubmit = async () => {
    if (!selected) return;

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        `${API_URL}/onboarding/native-language`,
        { nativeLanguage: selected },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (data.success) {
        onComplete(data.nextStage);
      } else {
        setError(data.message || tt("onboarding.native.error", "Failed to save selection."));
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
        <div className="text-5xl mb-4">🌍</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: textPrimary }}>
          {tt("onboarding.native.title", "What's your native language?")}
        </h1>
        <p className="opacity-80" style={{ color: textSecondary }}>
          {tt("onboarding.native.subtitle", "Select the language you grew up speaking.")}
        </p>
      </div>

      {/* Language Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-[400px] overflow-y-auto p-1">
        {LANGUAGES.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => setSelected(lang.code)}
              className="p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 hover:opacity-90"
              style={{
                borderColor: isSelected ? accent : border,
                backgroundColor: isSelected ? surfaceSelected : surface,
              }}
            >
              <img
                src={lang.flag}
                alt={lang.name}
                className="w-8 h-6 rounded shadow-sm object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <span className="text-sm font-medium truncate" style={{ color: textPrimary }}>
                {lang.name}
              </span>
              {isSelected && (
                <span className="ml-auto" style={{ color: accent }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

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
            {tt("onboarding.native.saving", "Saving...")}
          </span>
        ) : (
          tt("onboarding.native.continue", "Continue")
        )}
      </button>
    </div>
  );
}
