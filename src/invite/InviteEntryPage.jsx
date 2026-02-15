// src/invite/InviteEntryPage.jsx
// Entry point for /invite/:token - handles both authenticated and unauthenticated users

import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { Circles } from "react-loader-spinner";
import { useTranslation } from "../translator/hooks/useTranslation";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useBrand } from "../brands/BrandContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default function InviteEntryPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { theme, currentTheme } = useContext(ThemeContext);
  const { brand } = useBrand();
  const { t } = useTranslation();
  const appName = brand?.name || "Lit";

  const tt = (key, fallback) => {
    const value = t(key);
    return !value || value === key ? fallback : value;
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);

  const authToken = localStorage.getItem("token");
  const isAuthenticated = Boolean(authToken);
  const inviteTypes = Array.isArray(invitation?.inviteTypes) && invitation.inviteTypes.length
    ? invitation.inviteTypes.map((t) => String(t).toLowerCase())
    : invitation?.inviteType
    ? [String(invitation.inviteType).toLowerCase()]
    : [];
  const primaryInviteType = inviteTypes[0] || "friend";
  const useParentSkin = inviteTypes.includes("parent");

  const pageBg = theme?.surface?.app ?? currentTheme?.backgroundColor ?? "#0b0703";
  const cardBg = theme?.surface?.container ?? currentTheme?.headerBg ?? "#f3e7c3";
  const cardBorder = theme?.border?.default ?? currentTheme?.floatMenuBorder ?? "#b67b2c";
  const textPrimary = theme?.text?.primary ?? currentTheme?.mainTextColor ?? "#2a1c0f";
  const textSecondary = theme?.text?.secondary ?? currentTheme?.grayText ?? "#4a3523";
  const accent = theme?.action?.primary ?? currentTheme?.buttonColor ?? "#0d9488";
  const inverseText = theme?.text?.inverse ?? currentTheme?.buttonText ?? "#ffffff";
  const surfaceSubtle = theme?.surface?.containerSubtle ?? currentTheme?.placeholderBg ?? "#f5f5f5";
  const glow =
    accent && accent.startsWith("#") && accent.length === 7
      ? `${accent}55`
      : "rgba(0,0,0,0.2)";

  const containerClassName = "min-h-screen flex items-center justify-center p-6 relative";
  const containerStyle = { backgroundColor: pageBg, color: textPrimary };
  const cardClass = useParentSkin
    ? "max-w-md w-full rounded-2xl p-8"
    : "max-w-md w-full rounded-2xl p-8";
  const cardClassCentered = `${cardClass} text-center`;
  const cardStyle = {
    backgroundColor: cardBg,
    border: `1px solid ${cardBorder}`,
    boxShadow: `0 0 35px ${glow}`,
  };
  const primaryCtaClasses = useParentSkin
    ? "block w-full py-4 sm:py-5 rounded-full font-semibold text-lg text-center shadow-lg transition-all hover:opacity-90"
    : "block w-full py-4 sm:py-5 rounded-xl font-semibold text-base sm:text-lg text-center transition-all hover:opacity-90 shadow-md";
  const secondaryCtaClasses = useParentSkin
    ? "block w-full py-3 rounded-full font-semibold text-center border transition-all hover:opacity-90"
    : "block w-full py-3 rounded-lg font-semibold text-center border transition-all hover:opacity-90";
  const primaryCtaStyle = { backgroundColor: accent, color: inverseText, boxShadow: `0 0 20px ${glow}` };
  const secondaryCtaStyle = {
    borderColor: accent,
    color: accent,
    backgroundColor: surfaceSubtle,
  };
  const headingColor = textPrimary;
  const bodyMuted = textSecondary;
  const spinnerColor = accent;

  useEffect(() => {
    let cancelled = false;

    const validateInvite = async () => {
      try {
        if (!token) {
          setError("Missing invite token.");
          setLoading(false);
          return;
        }

        // Validate the token (public endpoint)
        const { data } = await axios.get(`${API_URL}/invitations/validate/${token}`);

        if (cancelled) return;

        if (!data?.success) {
          setError(data?.message || "This invite is invalid or expired.");
          setLoading(false);
          return;
        }

        setInvitation(data.invitation);

        // If user is authenticated, redirect to accept page
        if (isAuthenticated) {
          navigate(`/invite/${token}/accept`, { replace: true });
          return;
        }

        setLoading(false);
      } catch (e) {
        if (cancelled) return;

        const status = e.response?.status;
        const msg = e.response?.data?.message || e.message;

        if (status === 410) {
          setError("This invitation has expired. Please ask the sender for a new invite.");
        } else if (status === 404) {
          setError("This invitation doesn't exist or has been revoked.");
        } else {
          setError(msg || "Something went wrong validating the invitation.");
        }
        setLoading(false);
      }
    };

    validateInvite();

    return () => {
      cancelled = true;
    };
  }, [token, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div
        className={containerClassName}
        style={containerStyle}
      >
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>
        <div className="flex flex-col items-center gap-4">
          <Circles height="50" width="50" color={spinnerColor} />
          <p className="text-sm opacity-70" style={{ color: bodyMuted }}>
            {tt("invite.entry.loading", "Validating invitation...")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={containerClassName}
        style={containerStyle}
      >
        <div className="absolute top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>
        <div className={cardClassCentered} style={cardStyle}>
          <div className="text-6xl mb-4">
            <span role="img" aria-label="expired">
              {error.includes("expired") ? "⏰" : "😔"}
            </span>
          </div>
          <h1 className="text-xl font-bold mb-3" style={{ color: headingColor }}>
            {tt("invite.entry.errorTitle", "Invitation Issue")}
          </h1>
          <p className="mb-6" style={{ color: bodyMuted }}>{error}</p>
          <Link
            to="/welcome"
            className={
              useParentSkin
                ? "inline-block px-6 py-3 rounded-full font-semibold shadow-lg transition-all hover:opacity-90"
                : "inline-block px-6 py-3 rounded-lg font-semibold transition-colors"
            }
            style={primaryCtaStyle}
          >
            {tt("invite.entry.goHome", "Go to Home")}
          </Link>
        </div>
      </div>
    );
  }

  // Show welcome page for unauthenticated users
  const invitee = invitation?.firstName
    ? `${invitation.firstName}${invitation.lastName ? ` ${invitation.lastName}` : ""}`
    : tt("invite.entry.defaultInvitee", "there");
  const inviterName = invitation?.inviter?.name || tt("invite.entry.defaultInviter", "Someone");
  const inviteType = primaryInviteType;
  const subject = invitation?.subject;

  return (
    <div
      className={containerClassName}
      style={containerStyle}
    >
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <div className={cardClass} style={cardStyle}>
        <div className="flex justify-center mb-4">
          <img src={brand?.logo} alt={appName} className="h-12 w-12" />
        </div>
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">
            {inviteTypes.length > 1
              ? "🧭"
              : inviteType === "student"
              ? "📚"
              : inviteType === "parent"
              ? "👪"
              : "👋"}
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: headingColor }}>
            {tt("invite.entry.greeting", "Hey {name}!").replace("{name}", invitee)}
          </h1>
          {inviteTypes.length > 1 ? (
            <p style={{ color: bodyMuted }}>
              {inviterName} sent you a multi-role invite ({inviteTypes.join(", ")}). We’ll guide you to the right onboarding steps once you accept.
            </p>
          ) : inviteType === "student" ? (
            <p style={{ color: bodyMuted }}>
              {tt("invite.entry.studentInvitePrefix", "You've been invited to join") + " "}
              <span className="font-bold" style={{ color: accent }}>{appName}</span>{" "}
              {tt("invite.entry.byInviter", "by") + " "}
              <span className="font-semibold">{inviterName}</span>.
              <br />
              <span className="text-sm mt-2 block">
                {tt("invite.entry.studentInviteSubject", "{name} will teach you {subject}")
                  .replace("{name}", inviterName)
                  .replace("{subject}", subject || "")}
              </span>
            </p>
          ) : inviteType === "parent" ? (
            <p style={{ color: bodyMuted }}>
              You have been invited by <span className="font-semibold">{inviterName}</span> to join as a parent
              contact on <span className="font-bold" style={{ color: accent }}>{appName}</span>.
            </p>
          ) : (
            <p style={{ color: bodyMuted }}>
              {tt("invite.entry.friendInvitePrefix", "You've been invited to join") + " "}
              <span className="font-bold" style={{ color: accent }}>{appName}</span>{" "}
              {tt("invite.entry.byInviter", "by") + " "}
              <span className="font-semibold">{inviterName}</span>.
            </p>
          )}
        </div>

        {/* Question */}
        <div className="text-center mb-6">
          <p className="text-lg font-medium" style={{ color: textPrimary }}>
            {tt("invite.entry.haveAccount", "Do you already have an account?")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            to={`/signup?redirect=/invite/${token}`}
            className={primaryCtaClasses}
            style={primaryCtaStyle}
          >
            {tt("invite.entry.signup", "No - Create Account")}
          </Link>
          <Link
            to={`/login?redirect=/invite/${token}`}
            className={secondaryCtaClasses}
            style={secondaryCtaStyle}
          >
            {tt("invite.entry.login", "Yes - Log In")}
          </Link>
        </div>

        {/* Invitation message if present */}
        {invitation?.message && (
          <div
            className="mt-6 p-4 rounded-lg border"
            style={{ borderColor: cardBorder, backgroundColor: surfaceSubtle }}
          >
            <p className="text-sm mb-1" style={{ color: bodyMuted }}>
              {tt("invite.entry.messageFrom", "Message from {name}:").replace("{name}", inviterName)}
            </p>
            <p className="italic" style={{ color: textPrimary }}>
              "{invitation.message}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
