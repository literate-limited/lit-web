// src/hooks/useTranslation.js
import { useLocation } from "react-router-dom";
import { useLanguage } from "../../stores/useLanguageStore";
import { usePageRegistry } from "../../context/PageRegistryContext";

export const useTranslation = (customTranslations) => {
  const lang = useLanguage();
  const { pathname } = useLocation();
  const { resolvePageByPath, globalTokens } = usePageRegistry();
  const translations = customTranslations || {};
  const normalizedLang = (lang || "en").toLowerCase();
  const baseLang = normalizedLang.split("-")[0];
  const langKey = translations[normalizedLang] ? normalizedLang : baseLang;
  const langTranslations = translations[langKey] || translations.en || {};
  const page = resolvePageByPath(pathname);
  const labelOverrides = {
    ...(globalTokens?.labels || {}),
    ...(page?.tokens?.labels || {}),
  };

  const t = (key) => {
    if (!key) return "";
    if (labelOverrides[key]) return labelOverrides[key];
    const value = key.split('.').reduce((obj, k) => obj?.[k], langTranslations);
    return value ?? key;
  };

  return { t };
};
