// src/components/LanguageSwitcher.jsx
import React, { useContext, useMemo, useState } from "react";
import { useLanguage, useSetLanguage } from "../stores/useLanguageStore";
import { FaChevronDown } from "react-icons/fa";
import { ThemeContext } from "../utils/themes/ThemeContext";
import Tooltip from "./Tooltip";

const languages = {
  en: { short: "EN", full: "English", flag: "/flags/uk.svg" },
  es: { short: "ES", full: "Español", flag: "/flags/spain.svg" },
  fr: { short: "FR", full: "Français", flag: "/flags/france.svg" },
  de: { short: "DE", full: "Deutsch", flag: "/flags/germany.svg" },
  hi: { short: "HI", full: "Hindi", flag: "/flags/india.svg" },
};

const LanguageSwitcher = ({ useTtvTheme = false, iconOnly = false }) => {
  const lang = useLanguage();
  const setLang = useSetLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, themeKey } = useContext(ThemeContext) || {};

  // If we're running the TelepromptTV orb, default to the TTV pill styling.
  // Callers can also force it via `useTtvTheme`.
  const isTtv = useTtvTheme || themeKey === "ttv";

  const ttvStyles = useMemo(() => {
    if (!theme || !isTtv) return null;
    return {
      button: {
        backgroundColor: "rgba(15, 23, 42, 0.82)", // ttv.surface.container w/ alpha
        borderColor: theme.border?.default || "rgba(31, 41, 55, 0.9)",
        color: theme.text?.primary || "#E2E8F0",
        boxShadow:
          "0 10px 28px rgba(0,0,0,0.55), 0 0 0 1px rgba(34,211,238,0.08), 0 0 28px rgba(34,211,238,0.16)",
      },
      menu: {
        backgroundColor: "rgba(11, 18, 32, 0.98)", // ttv.surface.header w/ alpha
        borderColor: theme.border?.default || "rgba(31, 41, 55, 0.9)",
        color: theme.text?.primary || "#E2E8F0",
        boxShadow: "0 18px 48px rgba(0,0,0,0.65)",
      },
      active: {
        backgroundColor: "rgba(34, 211, 238, 0.14)", // ttv.action.primary w/ alpha
        color: theme.text?.primary || "#E2E8F0",
      },
      hover: {
        backgroundColor: "rgba(34, 211, 238, 0.08)",
      },
      accent: theme.action?.primary || "#22D3EE",
    };
  }, [theme, isTtv]);

  const handleSelect = (languageCode) => {
    setLang(languageCode);
    // No need to set localStorage manually - Zustand persist middleware handles it
    setIsOpen(false);
  };

  const showLabel = isTtv && !iconOnly;
  const showArrow = isTtv && !iconOnly;

  return (
    <div className="relative">
      <div className="relative flex items-center gap-1">
        <Tooltip text={`Display Language (${languages[lang].full})`} position="bottom">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label={`Language: ${languages[lang].full}`}
          className={
            isTtv
              ? `flex items-center ${showLabel ? "gap-2 px-3" : "gap-1 px-2"} py-2 rounded-full border transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-cyan-400/30`
              : "flex items-center justify-center p-2.5 rounded-full bg-[#f3e7c3]/95 border border-[#2a1c0f]/20 shadow-[0_0_25px_rgba(255,200,120,0.45)] transition hover:scale-105 hover:shadow-[0_0_35px_rgba(255,200,120,0.75)] focus:outline-none focus:ring-2 focus:ring-[#f3e7c3]/70"
          }
          style={isTtv ? ttvStyles?.button : undefined}
        >
          <img
            src={languages[lang].flag}
            alt={languages[lang].full}
            className={isTtv ? "w-5 h-4 rounded-sm" : "w-7 h-5 rounded-sm shadow-md saturate-125 contrast-110"}
          />
          {showLabel && (
            <span className="text-xs font-semibold uppercase tracking-wider">
              {languages[lang].short}
            </span>
          )}
          {showArrow && <FaChevronDown size={12} style={{ color: ttvStyles?.accent }} />}
          </button>
        </Tooltip>
      </div>

      {isOpen && (
        <div
          className={
            isTtv
              ? "absolute right-0 z-20 mt-2 w-[180px] min-w-[11rem] origin-top-right rounded-xl border backdrop-blur-md"
              : "absolute right-0 z-20 mt-2 w-[160px] min-w-[10rem] origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
          }
          style={isTtv ? ttvStyles?.menu : undefined}
          role="listbox"
        >
          <div className="py-1">
            {Object.entries(languages).map(([code, { full, flag }]) => (
              <button
                key={code}
                onClick={() => handleSelect(code)}
                className={
                  isTtv
                    ? `flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                        lang === code ? "bg-cyan-500/15 text-slate-100" : "text-slate-200 hover:bg-cyan-500/10"
                      }`
                    : `flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${
                        lang === code ? "bg-gray-100 text-[#0e7490]" : "text-gray-700 hover:bg-gray-50"
                      } transition-colors duration-200`
                }
                role="option"
                aria-selected={lang === code}
              >
                <img src={flag} alt={full} className="w-6 h-4" />
                <span className="flex-1">{full}</span>
                {lang === code && (
                  <span style={{ color: ttvStyles?.accent, fontWeight: 700 }}>
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
