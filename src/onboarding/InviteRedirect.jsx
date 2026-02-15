// onboarding/InviteRedirect.jsx — DROP-IN replacement

import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "../translator/hooks/useTranslation";
import { ThemeContext } from "../utils/themes/ThemeContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function InviteRedirect() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState({ loading: true, message: "" });
  const { t } = useTranslation();
  const { theme, currentTheme } = useContext(ThemeContext);
  const tt = (key, fallback) => {
    const value = t(key);
    return !value || value === key ? fallback : value;
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!token) {
          return setStatus({
            loading: false,
            message: tt("invite.redirect.missingToken", "Missing invite token."),
          });
        }

        // ✅ JSON validator
        const { data } = await axios.get(`${API_URL}/invitations/validate/${token}`);

        if (!data?.success) {
          return setStatus({
            loading: false,
            message:
              data?.message || tt("invite.redirect.invalid", "This invite is invalid or expired."),
          });
        }

        if (cancelled) return;

        // ✅ kick into your real onboarding flow
        navigate(`/invite/${token}`, { replace: true });
      } catch (e) {
        const msg =
          e.response?.data?.message ||
          e.message ||
          tt("invite.redirect.invalid", "This invite is invalid or expired.");
        if (!cancelled) setStatus({ loading: false, message: msg });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

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

  if (status.loading) {
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
          {tt("invite.redirect.loading", "Validating invitation...")}
        </div>
      </section>
    );
  }

  return (
    <section
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{ backgroundColor: pageBg }}
    >
      <div
        className="max-w-md w-full rounded-xl p-6"
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          color: textPrimary,
          boxShadow: `0 0 35px ${glow}`,
        }}
      >
        <div className="text-lg font-bold mb-2">
          {tt("invite.redirect.title", "Invitation issue")}
        </div>
        <div className="text-sm opacity-80 whitespace-pre-wrap" style={{ color: textSecondary }}>
          {status.message}
        </div>
        <button
          type="button"
          className="mt-4 px-5 py-2.5 rounded-full font-semibold shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
          style={{ backgroundColor: accent, color: inverseText, boxShadow: `0 0 20px ${glow}` }}
          onClick={() => navigate("/welcome", { replace: true })}
        >
          {tt("invite.redirect.goWelcome", "Go to welcome")}
        </button>
      </div>
    </section>
  );
}
