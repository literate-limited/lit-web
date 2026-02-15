// src/invite/InviteAcceptPage.jsx
// Accept/Decline invitation page for authenticated users

import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { Circles } from "react-loader-spinner";
import { useTranslation } from "../translator/hooks/useTranslation";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useBrand } from "../brands/BrandContext";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const INVITE_TYPES_KEY = "onboardingInviteTypes";

const rememberInviteTypes = (types = []) => {
  const list = Array.isArray(types) ? types : [types];
  const normalized = list
    .map((t) => String(t || "").trim().toLowerCase())
    .filter(Boolean);
  if (!normalized.length) return;
  try {
    const raw = localStorage.getItem(INVITE_TYPES_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const merged = Array.from(new Set([...existing, ...normalized]));
    localStorage.setItem(INVITE_TYPES_KEY, JSON.stringify(merged));
  } catch {
    /* ignore persistence issues */
  }
};

const addInvitesToPath = (path, inviteTypes) => {
  const list = Array.isArray(inviteTypes)
    ? inviteTypes
    : inviteTypes
    ? [inviteTypes]
    : [];
  if (!list.length) return path;
  const separator = path.includes("?") ? "&" : "?";
  const value = encodeURIComponent(list.join(","));
  return `${path}${separator}invites=${value}`;
};

const normalizeInviteTypes = (payload) => {
  if (Array.isArray(payload?.inviteTypes) && payload.inviteTypes.length) {
    return payload.inviteTypes.map((t) => String(t || "").toLowerCase());
  }
  if (payload?.inviteType) {
    return [String(payload.inviteType).toLowerCase()];
  }
  return [];
};

export default function InviteAcceptPage() {
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
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [result, setResult] = useState(null);
  const [alreadyFriends, setAlreadyFriends] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const redirectTimerRef = useRef(null);

  const authToken = localStorage.getItem("token");
  const activeInviteTypes = normalizeInviteTypes(invitation || result);
  const activeInviteType = activeInviteTypes[0] || "friend";
  const useParentSkin = activeInviteTypes.includes("parent");

  const pageBg = theme?.surface?.app ?? currentTheme?.backgroundColor ?? "#0b0703";
  const cardBg = theme?.surface?.container ?? currentTheme?.headerBg ?? "#f3e7c3";
  const cardBorder = theme?.border?.default ?? currentTheme?.floatMenuBorder ?? "#b67b2c";
  const textPrimary = theme?.text?.primary ?? currentTheme?.mainTextColor ?? "#2a1c0f";
  const textSecondary = theme?.text?.secondary ?? currentTheme?.grayText ?? "#4a3523";
  const accent = theme?.action?.primary ?? currentTheme?.buttonColor ?? "#0d9488";
  const inverseText = theme?.text?.inverse ?? currentTheme?.buttonText ?? "#ffffff";
  const surfaceSubtle = theme?.surface?.containerSubtle ?? currentTheme?.placeholderBg ?? "#f5f5f5";
  const surfaceInteractive = theme?.surface?.interactive ?? currentTheme?.innerContainerColor ?? "#f7edd1";
  const successBg = theme?.feedback?.successBg ?? "#D1FAE5";
  const successText = theme?.feedback?.successText ?? "#047857";
  const errorText = theme?.feedback?.errorText ?? "#b91c1c";
  const glow =
    accent && accent.startsWith("#") && accent.length === 7
      ? `${accent}55`
      : "rgba(0,0,0,0.2)";

  const containerClassName = "min-h-screen flex items-center justify-center p-6 relative";
  const containerStyle = { backgroundColor: pageBg, color: textPrimary };
  const cardClassBase = "max-w-md w-full rounded-2xl p-8";
  const cardClassCentered = `${cardClassBase} text-center`;
  const cardClass = cardClassBase;
  const cardStyle = {
    backgroundColor: cardBg,
    border: `1px solid ${cardBorder}`,
    boxShadow: `0 0 35px ${glow}`,
  };
  const primaryButtonClasses = useParentSkin
    ? "w-full py-3 rounded-full font-semibold transition-all hover:opacity-90 disabled:opacity-50"
    : "w-full py-3 rounded-lg font-semibold transition-all hover:opacity-90 disabled:opacity-50";
  const secondaryButtonClasses = useParentSkin
    ? "w-full py-3 rounded-full font-semibold border transition-all hover:opacity-90 disabled:opacity-50"
    : "w-full py-3 rounded-lg font-semibold border transition-all hover:opacity-90 disabled:opacity-50";
  const primaryButtonStyle = { backgroundColor: accent, color: inverseText, boxShadow: `0 0 20px ${glow}` };
  const secondaryButtonStyle = { borderColor: accent, color: accent, backgroundColor: surfaceSubtle };
  const spinnerColor = accent;
  const headingColor = textPrimary;

  const scheduleRedirect = ({
    inviteType,
    inviteTypes,
    nextStep,
    needsOnboarding: needsFlag,
    status,
    declined,
  } = {}) => {
    const typesList = normalizeInviteTypes({ inviteType, inviteTypes });
    const primary = typesList[0] || inviteType;
    const isDeclined = declined || status === "declined";
    const isParentInvite =
      !isDeclined && (typesList.includes("parent") || nextStep === "parent-onboarding");
    const isStudentInvite = typesList.includes("student");
    const onboardingPath = isStudentInvite ? "/onboarding?redirect=/student-dashboard" : "/onboarding";
    const homePath = isStudentInvite ? "/student-dashboard" : "/";
    const needs = typeof needsFlag === "boolean" ? needsFlag : needsOnboarding;

    if (!isDeclined && typesList.length) {
      rememberInviteTypes(typesList);
    }

    const target = isParentInvite
      ? addInvitesToPath(`/parent-onboarding${token ? `?invite=${token}` : ""}`, typesList)
      : nextStep === "onboarding" || needs
      ? addInvitesToPath(onboardingPath, typesList)
      : addInvitesToPath(homePath, typesList.length ? typesList : primary);

    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }
    redirectTimerRef.current = setTimeout(() => {
      navigate(target, { replace: true });
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      if (!authToken) {
        navigate(`/invite/${token}`, { replace: true });
        return;
      }

      try {
        const { data } = await axios.get(`${API_URL}/invitations/${token}/status`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (cancelled) return;

        if (!data?.success) {
          if (data?.isOwnInvite) {
            setError("You cannot accept your own invitation.");
          } else {
            setError(data?.message || "Invalid invitation.");
          }
          setLoading(false);
          return;
        }

        if (data.alreadyProcessed) {
          const inviteTypes = normalizeInviteTypes(data.invitation);
          const inviteType = inviteTypes[0] || data.invitation?.inviteType;
          const wasAccepted = data.status === "accepted";

          setInvitation(data.invitation);
          setNeedsOnboarding(Boolean(data.needsOnboarding));
          setResult({
            success: true,
            alreadyConnected: wasAccepted,
            accepted: wasAccepted,
            declined: data.status === "declined",
            inviteType,
            inviteTypes,
            inviter: data.invitation?.inviter,
            subject: data.invitation?.subject,
            message: data.message || `This invitation was already ${data.status}.`,
          });

          scheduleRedirect({
            inviteType,
            inviteTypes,
            nextStep: data.nextStep,
            needsOnboarding: data.needsOnboarding,
            status: data.status,
            declined: data.status === "declined",
          });
          setLoading(false);
          return;
        }

        setInvitation(data.invitation);
        setAlreadyFriends(data.alreadyFriends);
        setNeedsOnboarding(Boolean(data.needsOnboarding));
        const suggested = Array.isArray(data.invitation?.suggestedFriends)
          ? data.invitation.suggestedFriends
          : [];
        const mappedSuggested = suggested
          .map((friend) => ({
            _id: friend?._id || friend,
            name: friend?.name || friend?.handle || "Unknown",
            handle: friend?.handle || "",
            profilePicture: friend?.profilePicture || "",
            selected: true,
          }))
          .filter((friend) => friend._id);
        setSuggestedFriends(mappedSuggested);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;

        const status = e.response?.status;
        const msg = e.response?.data?.message;

        if (status === 401) {
          navigate(`/invite/${token}`, { replace: true });
          return;
        }
        if (status === 410) {
          setError(e.response?.data?.expired
            ? "This invitation has expired."
            : "This invitation has already been used.");
        } else if (status === 400 && e.response?.data?.isOwnInvite) {
          setError("You cannot accept your own invitation.");
        } else {
          setError(msg || "Something went wrong.");
        }
        setLoading(false);
      }
    };

    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, [token, authToken, navigate]);

  const handleAcceptDecline = async (action) => {
    setProcessing(true);

    try {
      const payload = { action };
      if (
        action === "accept" &&
        normalizeInviteTypes(invitation).includes("friend") &&
        suggestedFriends.length > 0
      ) {
        payload.selectedFriendIds = suggestedFriends
          .filter((friend) => friend.selected)
          .map((friend) => friend._id);
      }

      const { data } = await axios.post(
        `${API_URL}/invitations/${token}/accept-decline`,
        payload,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setResult(data);
      scheduleRedirect({
        inviteType: data.inviteType,
        inviteTypes: data.inviteTypes,
        nextStep: data.nextStep,
        declined: data.declined,
        status: data.declined ? "declined" : data.accepted ? "accepted" : undefined,
      });
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      setError(msg);
      setProcessing(false);
    }
  };

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
          <p className="text-sm opacity-70" style={{ color: textSecondary }}>
            {tt("invite.accept.loading", "Loading invitation...")}
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
          <div className="text-6xl mb-4">😔</div>
          <h1
            className="text-xl font-bold mb-3"
            style={{ color: headingColor }}
          >
            {tt("invite.accept.errorTitle", "Invitation Issue")}
          </h1>
          <p className="mb-6" style={{ color: errorText }}>{error}</p>
          <Link
            to="/"
            className={
              useParentSkin
                ? "inline-block px-6 py-3 rounded-full font-semibold shadow-lg transition-all hover:opacity-90"
                : "inline-block px-6 py-3 rounded-lg font-semibold transition-colors"
            }
            style={primaryButtonStyle}
          >
            {tt("invite.accept.goHome", "Go Home")}
          </Link>
        </div>
      </div>
    );
  }

  if (result) {
    const isAccepted = result.accepted;
    const isDeclined = result.declined;
    const typesList = normalizeInviteTypes(result);
    const isStudentInvite = typesList.includes("student");
    const isParentInvite = typesList.includes("parent");

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
            {result.alreadyConnected ? "✅" : isAccepted ? (isStudentInvite ? "📚" : isParentInvite ? "👪" : "🎉") : "👋"}
          </div>
          <h1
            className="text-xl font-bold mb-3"
            style={{ color: headingColor }}
          >
            {result.alreadyConnected
              ? tt("invite.accept.alreadyConnected", "Already Connected!")
              : isAccepted
              ? isStudentInvite
                ? tt("invite.accept.nowStudent", "You're Now a Student!")
                : isParentInvite
                ? "You're now a parent contact!"
                : tt("invite.accept.connected", "Connected!")
              : tt("invite.accept.noWorries", "No Worries!")}
          </h1>
          <p className="mb-4" style={{ color: textSecondary }}>
            {result.message}
          </p>

          {/* Student-specific welcome message */}
          {isAccepted && isStudentInvite && result.subject && (
            <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: successBg, border: `1px solid ${cardBorder}` }}>
              <p style={{ color: successText }}>
                {tt("invite.accept.studentInfo", "{name} will be teaching you {subject}.")
                  .replace("{name}", result.inviter?.name || "")
                  .replace("{subject}", result.subject)}
              </p>
              <p className="text-sm mt-2" style={{ color: textSecondary }}>
                {tt(
                  "invite.accept.studentDashboardHint",
                  "Check your Student Dashboard to see assigned lessons!"
                )}
              </p>
            </div>
          )}

          {needsOnboarding && !isDeclined && (
            <p className="text-sm" style={{ color: accent }}>
              {tt("invite.accept.redirectOnboarding", "Redirecting you to complete your profile...")}
            </p>
          )}
          {!needsOnboarding && (
            <p className="text-sm" style={{ color: textSecondary }}>
              {tt("invite.accept.redirectApp", "Redirecting you to the app...")}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Show accept/decline UI
  const inviterName = invitation?.inviter?.name || tt("invite.accept.defaultInviter", "Someone");
  const inviteTypes = normalizeInviteTypes(invitation);
  const inviteType = inviteTypes[0] || "friend";
  const subject = invitation?.subject;
  const inviterPic = invitation?.inviter?.profilePicture;
  const showSuggestedFriends =
    inviteTypes.includes("friend") && suggestedFriends.length > 0;

  const toggleSuggestedFriend = (friendId) => {
    setSuggestedFriends((prev) =>
      prev.map((friend) =>
        friend._id === friendId
          ? { ...friend, selected: !friend.selected }
          : friend
      )
    );
  };

  return (
    <div
      className={containerClassName}
      style={containerStyle}
    >
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      <div className={cardClass} style={cardStyle}>
        <div className="flex justify-center mb-4">
          <img src={brand?.logo} alt={appName} className="h-12 w-12" />
        </div>
        {/* Inviter Profile */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {inviterPic ? (
              <img src={inviterPic} alt={inviterName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">👤</span>
            )}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: headingColor }}>
            {inviterName}
          </h1>
          <p className="text-sm" style={{ color: textSecondary }}>
            @{invitation?.inviter?.handle || tt("invite.accept.defaultHandle", "user")}
          </p>
        </div>

        {/* Invite Type Description */}
        <div
          className="rounded-lg p-4 mb-6 border"
          style={{ borderColor: cardBorder, backgroundColor: surfaceSubtle }}
        >
          {inviteTypes.length > 1 ? (
            <div className="text-center">
              <span className="text-3xl mb-2 block">🧭</span>
              <p style={{ color: textPrimary }}>
                {inviterName} sent you a multi-role invite ({inviteTypes.join(", ")}). We’ll route you to the right onboarding steps.
              </p>
              <p className="text-sm mt-2" style={{ color: textSecondary }}>
                Accept to choose the role that fits you and continue onboarding.
              </p>
            </div>
          ) : inviteType === "student" ? (
            <div className="text-center">
              <span className="text-3xl mb-2 block">📚</span>
              <p style={{ color: textPrimary }}>
                {tt("invite.accept.studentInvite", "{name} wants to teach you {subject}")
                  .replace("{name}", inviterName)
                  .replace("{subject}", subject || "")}
              </p>
              <p className="text-sm mt-2" style={{ color: textSecondary }}>
                {tt(
                  "invite.accept.studentInviteHint",
                  "Accept to become their student and start learning."
                )}
              </p>
            </div>
          ) : inviteType === "parent" ? (
            <div className="text-center">
              <span className="text-3xl mb-2 block">👪</span>
              <p style={{ color: textPrimary }}>
                {inviterName} wants to connect with you as a parent contact on{" "}
                <span className="font-bold" style={{ color: accent }}>{appName}</span>
              </p>
              <p className="text-sm mt-2" style={{ color: textSecondary }}>
                Accept to add your children and stay connected.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-3xl mb-2 block">🤝</span>
              <p style={{ color: textPrimary }}>
                {tt("invite.accept.friendInvitePrefix", "{name} wants to be your friend on")
                  .replace("{name}", inviterName)}{" "}
                <span className="font-bold" style={{ color: accent }}>{appName}</span>
              </p>
            </div>
          )}
        </div>

        {showSuggestedFriends && (
          <div
            className="rounded-lg p-4 mb-6 border"
            style={{ borderColor: cardBorder, backgroundColor: surfaceSubtle }}
          >
            <div className="text-sm font-semibold mb-3" style={{ color: textPrimary }}>
              {tt("invite.accept.suggestedTitle", "People you might know")}
            </div>
            <div className="space-y-2">
              {suggestedFriends.map((friend) => {
                const isSelected = friend.selected;
                return (
                  <button
                    key={friend._id}
                    type="button"
                    onClick={() => toggleSuggestedFriend(friend._id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:opacity-90"
                    style={{
                      borderColor: isSelected ? accent : cardBorder,
                      backgroundColor: isSelected ? surfaceInteractive : surfaceSubtle,
                    }}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {friend.profilePicture ? (
                          <img
                            src={friend.profilePicture}
                            alt={friend.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">👤</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: textPrimary }}>
                          {friend.name}
                        </div>
                        {friend.handle && (
                          <div className="text-xs" style={{ color: textSecondary }}>
                            @{friend.handle}
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className="w-5 h-5 rounded border flex items-center justify-center text-xs font-semibold"
                      style={{
                        borderColor: isSelected ? accent : cardBorder,
                        backgroundColor: isSelected ? accent : "transparent",
                        color: isSelected ? inverseText : "transparent",
                      }}
                    >
                      ✓
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs mt-3" style={{ color: textSecondary }}>
              {tt(
                "invite.accept.suggestedHint",
                "We'll send friend requests to your selected contacts."
              )}
            </p>
          </div>
        )}

        {/* Already friends notice */}
        {alreadyFriends && (
          <div
            className="rounded-lg p-3 mb-6 text-center border"
            style={{ backgroundColor: successBg, borderColor: cardBorder }}
          >
            <p className="text-sm" style={{ color: successText }}>
              {tt("invite.accept.alreadyFriends", "✅ You're already friends with {name}!")
                .replace("{name}", inviterName)}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleAcceptDecline("accept")}
            disabled={processing}
            className={primaryButtonClasses}
            style={primaryButtonStyle}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <Circles height="20" width="20" color={inverseText} />
                {tt("invite.accept.processing", "Processing...")}
              </span>
            ) : alreadyFriends ? (
              tt("invite.accept.continue", "Continue")
            ) : (
              tt("invite.accept.accept", "Accept")
            )}
          </button>

          {!alreadyFriends && (
            <button
              onClick={() => handleAcceptDecline("decline")}
              disabled={processing}
              className={secondaryButtonClasses}
              style={secondaryButtonStyle}
            >
              {tt("invite.accept.decline", "Decline")}
            </button>
          )}
        </div>

        {/* Onboarding note */}
        {needsOnboarding && (
          <p className="text-xs text-center mt-4" style={{ color: textSecondary }}>
            {tt(
              "invite.accept.onboardingNote",
              "After accepting, you'll complete a quick profile setup."
            )}
          </p>
        )}
      </div>
    </div>
  );
}
