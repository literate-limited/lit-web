// src/onboarding/steps/DisplayLanguageStep.jsx
// Step 3: Confirm or select display language

import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Circles } from "react-loader-spinner";
import { useSetLanguage } from "../../stores/useLanguageStore";
import { useTranslation } from "../../translator/hooks/useTranslation";
import { ThemeContext } from "../../utils/themes/ThemeContext";
import onboardingTranslations from "../translations";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// Language display names
const LANGUAGE_NAMES = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  hi: "हिन्दी",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  pt: "Português",
  it: "Italiano",
  ru: "Русский",
  ar: "العربية",
};

// Available display languages (should align with what UI supports)
const LANGUAGES = [
  { code: "en", name: "English", flag: "/flags/uk.svg" },
  { code: "es", name: "Español", flag: "/flags/spain.svg" },
  { code: "fr", name: "Français", flag: "/flags/france.svg" },
  { code: "de", name: "Deutsch", flag: "/flags/germany.svg" },
  { code: "hi", name: "हिन्दी (Hindi)", flag: "/flags/india.svg" },
];

// Check if a language is supported for UI display
const SUPPORTED_UI_LANGUAGES = new Set(LANGUAGES.map((l) => l.code));

export default function DisplayLanguageStep({ userData, onComplete, currentTheme, currentLang }) {
  const { theme } = useContext(ThemeContext);
  const setLang = useSetLanguage();
  const { t } = useTranslation(onboardingTranslations);
  const tt = (key, fallback) => {
    const value = t(key);
    return !value || value === key ? fallback : value;
  };

  const nativeLanguage = userData?.nativeLanguage || currentLang || "en";
  const nativeLanguageName = LANGUAGE_NAMES[nativeLanguage] || nativeLanguage.toUpperCase();

  // Check if native language is supported for UI
  const nativeSupported = SUPPORTED_UI_LANGUAGES.has(nativeLanguage);
  const otherOptions = LANGUAGES.filter((lang) => lang.code !== nativeLanguage);
  const defaultOther = otherOptions.some((lang) => lang.code === currentLang)
    ? currentLang
    : otherOptions[0]?.code || "en";

  const preferredDisplay = userData?.displayLanguage || currentLang || nativeLanguage;
  const preferredSupported = SUPPORTED_UI_LANGUAGES.has(preferredDisplay);
  const shouldUseNative =
    preferredSupported && nativeSupported
      ? preferredDisplay === nativeLanguage
      : nativeSupported;

  const [choice, setChoice] = useState(() => (shouldUseNative ? "native" : "other")); // "native" | "other"
  const [selectedOther, setSelectedOther] = useState(() => {
    if (shouldUseNative) return null;
    if (preferredSupported && preferredDisplay !== nativeLanguage) {
      return preferredDisplay;
    }
    return defaultOther;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authToken = localStorage.getItem("token");

  useEffect(() => {
    if (!nativeSupported) {
      if (choice !== "other") setChoice("other");
      if (!selectedOther) setSelectedOther(defaultOther);
      return;
    }

    const nextDisplay = userData?.displayLanguage || currentLang;
    if (!nextDisplay || !SUPPORTED_UI_LANGUAGES.has(nextDisplay)) return;

    if (nextDisplay === nativeLanguage) {
      if (choice !== "native") setChoice("native");
      if (selectedOther !== null) setSelectedOther(null);
      return;
    }

    if (choice !== "other") setChoice("other");
    if (selectedOther !== nextDisplay) setSelectedOther(nextDisplay);
  }, [
    choice,
    currentLang,
    defaultOther,
    nativeLanguage,
    nativeSupported,
    selectedOther,
    userData?.displayLanguage,
  ]);

  const handleSubmit = async () => {
    if (!choice) return;
    if (choice === "other" && !selectedOther) return;

    setLoading(true);
    setError(null);

    try {
      const payload =
        choice === "native"
          ? { useNative: true }
          : { displayLanguage: selectedOther };

      const { data } = await axios.post(
        `${API_URL}/onboarding/display-language`,
        payload,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (data.success) {
        // Sync display language to LanguageContext and localStorage
        const finalLang = choice === "native" ? nativeLanguage : selectedOther;
        if (SUPPORTED_UI_LANGUAGES.has(finalLang)) {
          setLang(finalLang);
          localStorage.setItem("lang", finalLang);
        }

        onComplete(data.nextStage);
      } else {
        setError(data.message || tt("onboarding.display.error", "Failed to save selection."));
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
        <div className="text-5xl mb-4">🖥️</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: textPrimary }}>
          {tt("onboarding.display.title", "Display Language")}
        </h1>
        <p className="opacity-80" style={{ color: textSecondary }}>
          {tt(
            "onboarding.display.question",
            "Would you like to use {language} as your display language?"
          ).replace("{language}", nativeLanguageName)}
        </p>
        {!nativeSupported && (
          <p className="text-sm mt-2" style={{ color: theme?.feedback?.errorText ?? "#a14517" }}>
            {tt(
              "onboarding.display.unsupported",
              "Note: {language} is not yet fully supported for UI. You may want to choose a different display language."
            ).replace("{language}", nativeLanguageName)}
          </p>
        )}
      </div>

      {/* Choice */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => {
            setChoice("native");
            setSelectedOther(null);
          }}
          className="w-full p-4 rounded-xl border-2 text-left transition-all hover:opacity-90"
          style={{
            borderColor: choice === "native" ? accent : border,
            backgroundColor: choice === "native" ? surfaceSelected : surface,
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="font-semibold" style={{ color: textPrimary }}>
                {tt(
                  "onboarding.display.useNative",
                  "Yes, use {language}"
                ).replace("{language}", nativeLanguageName)}
              </h3>
              <p className="text-sm opacity-70" style={{ color: textSecondary }}>
                {tt(
                  "onboarding.display.useNativeHint",
                  "The app will be displayed in your native language."
                )}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setChoice("other");
            if (!selectedOther) {
              setSelectedOther(defaultOther);
            }
          }}
          className="w-full p-4 rounded-xl border-2 text-left transition-all hover:opacity-90"
          style={{
            borderColor: choice === "other" ? accent : border,
            backgroundColor: choice === "other" ? surfaceSelected : surface,
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">🌐</span>
            <div>
              <h3 className="font-semibold" style={{ color: textPrimary }}>
                {tt("onboarding.display.chooseOther", "No, choose a different language")}
              </h3>
              <p className="text-sm opacity-70" style={{ color: textSecondary }}>
                {tt(
                  "onboarding.display.chooseOtherHint",
                  "Select another language for the interface."
                )}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Other language selection */}
      {choice === "other" && (
        <div className="mb-6">
          <p className="text-sm opacity-70 mb-3" style={{ color: textSecondary }}>
            {tt(
              "onboarding.display.selectOther",
              "Select your preferred display language:"
            )}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {otherOptions.map((lang) => {
              const isSelected = selectedOther === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setSelectedOther(lang.code)}
                  className="p-3 rounded-lg border-2 flex items-center gap-2 transition-all hover:opacity-90"
                  style={{
                    borderColor: isSelected ? accent : border,
                    backgroundColor: isSelected ? surfaceSelected : surface,
                  }}
                >
                  <img
                    src={lang.flag}
                    alt={lang.name}
                    className="w-6 h-4 rounded shadow-sm object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <span className="text-sm font-medium" style={{ color: textPrimary }}>
                    {lang.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center text-red-500 text-sm mb-4">{error}</div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!choice || (choice === "other" && !selectedOther) || loading}
        className="w-full py-3 rounded-full font-semibold shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
        style={{ backgroundColor: accent, color: inverseText, boxShadow: `0 0 20px ${glow}` }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Circles height="20" width="20" color={inverseText} />
            {tt("onboarding.display.saving", "Saving...")}
          </span>
        ) : (
          tt("onboarding.display.continue", "Continue")
        )}
      </button>
    </div>
  );
}
