/**
 * useLanguageStore - Zustand store for language selection
 *
 * Manages application language with localStorage persistence
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type SupportedLanguage =
  | 'en'  // English
  | 'es'  // Spanish
  | 'fr'  // French
  | 'de'  // German
  | 'it'  // Italian
  | 'pt'  // Portuguese
  | 'zh'  // Chinese
  | 'ja'  // Japanese
  | 'ko'  // Korean
  | 'ar'; // Arabic

interface LanguageStoreState {
  // State
  lang: SupportedLanguage;

  // Actions
  setLang: (lang: SupportedLanguage) => void;
  reset: () => void;
}

const defaultLanguage: SupportedLanguage = 'en';

export const useLanguageStore = create<LanguageStoreState>()(
  devtools(
    persist(
      immer((set) => ({
      lang: defaultLanguage,

      setLang: (lang) => {
        set((state) => {
          state.lang = lang;
        });
      },

      reset: () => {
        set((state) => {
          state.lang = defaultLanguage;
        });
      },
    })),
    {
      name: 'language-storage', // localStorage key
      // Migrate old localStorage format
      onRehydrateStorage: () => (state) => {
        // Migrate from old 'lang' key
        const oldLang = localStorage.getItem('lang');
        if (oldLang && state) {
          state.lang = oldLang as SupportedLanguage;
          localStorage.removeItem('lang'); // Clean up old key
        }
      },
    }),
    { name: 'LanguageStore' }
  )
);

// Convenience hooks
export const useLanguage = () => useLanguageStore((state) => state.lang);
export const useSetLanguage = () => useLanguageStore((state) => state.setLang);

// Language metadata
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
};

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ko: '🇰🇷',
  ar: '🇸🇦',
};
