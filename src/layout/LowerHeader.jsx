/* -----------------------------------------------------------------
  LowerHeader.jsx – token-theme header + OFFSET for UpperHeader
  - If UpperHeader is mounted: UpperHeader top-0 h-12 (48px), LowerHeader top-12
  - If UpperHeader is NOT mounted (your current setup): LowerHeader top-0
------------------------------------------------------------------- */

import { useContext, useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { signOut } from "../utils/common.utils";
import { resolveApiUrl } from "../api/resolveApiUrl";
import ProfileDropdown from "../components/ProfileDropdown";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { useTranslation } from "../translator/hooks/useTranslation";
import headerTranslations from "../translations/header";
import { useUser } from "../context/UserContext";
import { useCredits } from "../hooks/useCredits";
import BuyCreditsModal from "../payments/components/modals/CreditsModal";
import { FaBars } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import SearchModal from "../utils/search/SearchModal";
import { useBrand } from "../brands/BrandContext";
import { useLessonGame } from "../hooks/useLesson";

const API_URL = resolveApiUrl();

/**
 * ✅ ONLY FIX:
 * You retired <UpperHeader /> in MainLayout for now, so Upper offset must be 0.
 * When you re-enable UpperHeader, flip HAS_UPPER_HEADER to true.
 */
const HAS_UPPER_HEADER = false;

const UPPER_H = HAS_UPPER_HEADER ? 48 : 0; // px
const LOWER_H = 64; // px
const NOTICE_TOP = UPPER_H + LOWER_H; // 64px (no UpperHeader) OR 112px (with UpperHeader)

export default function LowerHeader({ onToggleMobileMenu }) {
  /* ------------------------------- ctx ------------------------------- */
  const { level } = useLessonGame();
  const { userLoggedIn } = useUser();
  const { currentTheme, theme } = useContext(ThemeContext);
  const { t } = useTranslation(headerTranslations);
  const { user } = useUser();
  const { credits } = useCredits();
  const { brandId, brand } = useBrand();
  const isTtv = brandId === "ttv";

  const tkn = theme;

  /* --------------------------- local state --------------------------- */
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // 🔔 Friend request notifications (restored)
  const [showNotifications, setShowNotifications] = useState(false);
  const [localFriendRequests, setLocalFriendRequests] = useState(
    user?.friendRequests ?? []
  );
  const [notifError, setNotifError] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);

  const lit = user?.lit ?? 0;
  const userVerified = !!user?.verified;

  /* ------------------------ sync friend requests --------------------- */
  useEffect(() => {
    setLocalFriendRequests(user?.friendRequests ?? []);
  }, [user?.friendRequests]);

  const pendingFriendRequests = localFriendRequests || [];
  const hasFriendRequests = pendingFriendRequests.length > 0;

  /* ------------------------------ helpers ---------------------------- */
  const handleResendVerification = async () => {
    try {
      setVerifyLoading(true);
      const res = await fetch(`${API_URL}/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email }),
      });
      const data = await res.json();
      alert(data.success ? "Verification email sent!" : "Failed to send email.");
    } catch (err) {
      console.error(err);
      alert("Error sending verification email.");
    } finally {
      setVerifyLoading(false);
      setVerifyModalOpen(false);
    }
  };

  const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
    return "?";
  };

  const toggleNotifications = () => {
    // improvement: allow opening even if empty, so bell isn't “dead”
    setShowNotifications((prev) => !prev);
    setNotifError(null);
  };

  const handleAcceptRequest = async (request) => {
    if (!request?.from) return;

    const from = request.from;
    const fromUserId =
      typeof from === "object" && from !== null ? from._id : from;

    if (!fromUserId) return;

    setAcceptingId(fromUserId);
    setNotifError(null);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/friend-request/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fromUserId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to accept friend request");
      }

      // Remove this request from local list
      setLocalFriendRequests((prev) =>
        prev.filter((req) => {
          const id =
            typeof req.from === "object" && req.from !== null
              ? req.from._id
              : req.from;
          return id !== fromUserId;
        })
      );
    } catch (err) {
      console.error("accept friend request error:", err);
      setNotifError(err.message || "Error accepting friend request");
    } finally {
      setAcceptingId(null);
    }
  };

  // Close dropdown if user logs out
  useEffect(() => {
    if (!userLoggedIn) setShowNotifications(false);
  }, [userLoggedIn]);

  /* ------------------------ token-first styling ---------------------- */
  const colors = useMemo(() => {
    const headerBg =
      tkn?.surface?.header ?? currentTheme?.headerBg ?? "#bdd8dd";

    const headerText =
      tkn?.text?.heading ??
      tkn?.text?.primary ??
      currentTheme?.headerTextColor ??
      currentTheme?.mainTextColor ??
      currentTheme?.textColor ??
      "#000";

    const border =
      tkn?.border?.default ??
      currentTheme?.floatMenuBorder ??
      "rgba(255,255,255,0.35)";

    const chipLitBg =
      tkn?.status?.accent ??
      tkn?.action?.primary ??
      currentTheme?.buttonColor ??
      "#ea580c";

    const chipGoldBg =
      tkn?.status?.warning ??
      tkn?.status?.gold ??
      "#ca8a04";

    const chipText = tkn?.text?.inverse ?? currentTheme?.buttonText ?? "#fff";

    const menuBtnBg =
      tkn?.surface?.interactive ??
      currentTheme?.placeholderBg ??
      "rgba(255,255,255,0.85)";

    const menuBtnText = tkn?.icon?.default ?? headerText;

    const noticeBg =
      tkn?.surface?.notice ??
      currentTheme?.headerNoticeBg ??
      "rgba(255,255,255,0.2)";

    const noticeText =
      tkn?.text?.inverse ?? currentTheme?.headerNoticeText ?? "#fff";

    // 🔔 dropdown styling
    const dropBg =
      tkn?.surface?.menu ??
      tkn?.surface?.container ??
      currentTheme?.floatMenuBg ??
      "#ffffff";

    const dropText =
      tkn?.text?.primary ?? currentTheme?.floatMenuText ?? "#111827";

    const dropBorder =
      tkn?.border?.default ??
      currentTheme?.floatMenuBorder ??
      "rgba(0,0,0,0.1)";

    return {
      headerBg,
      headerText,
      border,
      chipLitBg,
      chipGoldBg,
      chipText,
      menuBtnBg,
      menuBtnText,
      noticeBg,
      noticeText,
      dropBg,
      dropText,
      dropBorder,
    };
  }, [tkn, currentTheme]);

  const headerStyle = {
    backgroundColor: colors.headerBg,
    color: colors.headerText,
    borderBottom: `1px solid ${colors.border}`,
  };

  const LitChip =
    isTtv || !userLoggedIn
      ? null
      : (
          <div
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full shadow"
            style={{ backgroundColor: colors.chipLitBg, color: colors.chipText }}
            aria-label="Lit"
            title="Lit"
          >
            🔥 <span>{lit}</span>
          </div>
        );

  const GoldChip = userLoggedIn ? (
    <button
      type="button"
      onClick={() => setCreditsModalOpen(true)}
      className="text-xs font-semibold px-2 py-1 rounded-full shadow active:scale-[0.98] transition-transform"
      style={{ backgroundColor: colors.chipGoldBg, color: colors.chipText }}
      aria-label="Credits"
      title="Credits"
    >
      💰 {credits}
    </button>
  ) : null;

  const LevelChip = userLoggedIn ? (
    <div
      className="hidden sm:flex items-center text-[11px] font-semibold px-2 py-1 rounded-full shadow"
      style={{ backgroundColor: colors.menuBtnBg, color: colors.menuBtnText }}
      title={`${t("levelDisplay")} : ${level}`}
      aria-label="Level"
    >
      {t("levelDisplay")} : {level}
    </div>
  ) : null;

  const BrandIcon = (
    <Link to="/" className="flex items-center" aria-label="Home">
      <img
        src={brand?.logo}
        alt="Logo"
        width={36}
        height={36}
        style={{ display: "block" }}
      />
    </Link>
  );

  const Bell = userLoggedIn ? (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={toggleNotifications}
        className="w-10 h-10 rounded-lg shadow flex items-center justify-center active:scale-[0.98] transition-transform"
        style={{
          backgroundColor: colors.menuBtnBg,
          color: colors.menuBtnText,
        }}
        title="Friend requests"
      >
        <span role="img" aria-label="notifications">
          🔔
        </span>
      </button>

      {hasFriendRequests && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-[1px]">
          {pendingFriendRequests.length}
        </span>
      )}

      {showNotifications && (
        <div
          className="absolute right-0 mt-2 w-72 sm:w-80 rounded-lg shadow-lg border text-sm z-[90]"
          style={{
            backgroundColor: colors.dropBg,
            color: colors.dropText,
            borderColor: colors.dropBorder,
          }}
        >
          <div className="px-3 py-2 font-semibold border-b">Friend requests</div>

          {pendingFriendRequests.length === 0 ? (
            <div className="px-3 py-3 text-xs opacity-70">No friend requests.</div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {pendingFriendRequests.map((req) => {
                const from = req.from;
                const isObj = typeof from === "object" && from !== null;
                const fromId = isObj ? from._id : from;
                const name = isObj ? from.name : "New friend request";
                const handle = isObj && from.handle ? from.handle : null;
                const created = req.createdAt ? new Date(req.createdAt) : null;

                return (
                  <div
                    key={req._id || fromId}
                    className="px-3 py-2 flex items-center justify-between border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-cyan-500 text-white text-xs font-semibold shrink-0">
                        {getInitials(name)}
                      </div>

                      <div className="flex flex-col min-w-0">
                        {handle ? (
                          <Link
                            to={`/profile/${handle}`}
                            className="font-semibold hover:underline truncate"
                            onClick={() => setShowNotifications(false)}
                          >
                            {name}
                          </Link>
                        ) : (
                          <span className="font-semibold truncate">{name}</span>
                        )}

                        {handle && (
                          <span className="text-[11px] opacity-70 truncate">
                            @{handle}
                          </span>
                        )}

                        {created && (
                          <span className="text-[10px] opacity-60 mt-1">
                            {created.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptRequest(req)}
                      disabled={acceptingId === fromId}
                      className="ml-2 px-2 py-1 rounded bg-green-600 text-white text-[11px] disabled:opacity-60"
                    >
                      {acceptingId === fromId ? "Adding…" : "Accept"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {notifError && (
            <div className="px-3 py-2 text-xs text-red-600 border-t">
              {notifError}
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;

  /* -------------------------- unified bar ------------------------ */
  const Bar = ({ isMobile }) => (
    <div
      className="fixed left-0 right-0 h-16 z-[60] shadow-md"
      style={{
        ...headerStyle,
        top: `${UPPER_H}px`,
      }}
    >
      <div className="flex items-center h-full px-3 gap-2">
        {/* 1) Hamburger */}
        <button
          type="button"
          aria-label="Menu"
          onClick={isMobile ? onToggleMobileMenu : undefined}
          className="w-10 h-10 rounded-lg shadow flex items-center justify-center active:scale-[0.98] transition-transform"
          style={{
            backgroundColor: colors.menuBtnBg,
            color: colors.menuBtnText,
            cursor: isMobile ? "pointer" : "default",
            opacity: isMobile ? 1 : 0.6,
          }}
          title={isMobile ? "Menu" : "Menu (sidebar on desktop)"}
        >
          <FaBars size={18} />
        </button>

        {/* 2) Lit🔥 */}
        {LitChip}

        {/* 2.5) Level (desktop-ish) */}
        {LevelChip}

        {/* 3) Brand icon (center) */}
        <div className="flex-1 flex justify-center">{BrandIcon}</div>

        {/* 4) Gold */}
        {GoldChip}

        {/* 5) Search */}
        <button
          type="button"
          aria-label="Search"
          onClick={() => setSearchModalOpen(true)}
          className="w-10 h-10 rounded-lg shadow flex items-center justify-center active:scale-[0.98] transition-transform"
          style={{
            backgroundColor: colors.menuBtnBg,
            color: colors.menuBtnText,
          }}
          title="Search"
        >
          <FiSearch size={18} />
        </button>

        {/* 6) 🔔 Friend requests */}
        {Bell}

        {/* 7) Profile dropdown */}
        <div className="ml-1">
          <ProfileDropdown onLogout={signOut} />
        </div>
      </div>
    </div>
  );

  /* -------------------------- notices (fixed bar) -------------------------- */
  const VerifyNotice =
    userLoggedIn && !userVerified ? (
      <div
        className="fixed left-0 right-0 flex z-[55] w-full justify-center items-center h-7 text-xs"
        style={{
          top: `${NOTICE_TOP}px`,
          backgroundColor: colors.noticeBg,
          color: colors.noticeText,
        }}
      >
        <span
          style={{ cursor: "pointer" }}
          onClick={() => setVerifyModalOpen(true)}
        >
          Please verify your account. Click here to receive verification email.
        </span>
      </div>
    ) : null;

  const GuestNotice = !userLoggedIn ? (
    <div
      className="fixed left-0 right-0 flex z-[55] w-full justify-center items-center h-7 text-xs"
      style={{
        top: `${NOTICE_TOP}px`,
        backgroundColor: colors.noticeBg,
        color: colors.noticeText,
      }}
    >
      <span>{t("signInNotice")}</span>
    </div>
  ) : null;

  /* ---------------------------- verify modal ---------------------------- */
  const VerifyModal = verifyModalOpen ? (
    <div className="fixed inset-0 bg-gray-800/50 flex justify-center items-center z-[95]">
      <div className="bg-white p-6 rounded-lg w-11/12 sm:w-1/3 shadow-lg">
        <h3 className="text-center text-xl font-semibold">
          Let's verify your email!
        </h3>
        <p className="mt-4 text-center">
          Please check that the email below is correct.
        </p>
        <p className="text-center font-medium">{user?.email}</p>
        <div className="flex justify-center mt-6">
          <button
            onClick={handleResendVerification}
            className={`py-2 px-4 bg-blue-500 text-white rounded ${
              verifyLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={verifyLoading}
          >
            {verifyLoading ? "Sending…" : "Send verification email"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  /* -------------------------- render ----------------------------- */
  return (
    <>
      {/* Bars: mobile + desktop */}
      <div className="md:hidden">
        <Bar isMobile />
      </div>
      <div className="hidden md:block">
        <Bar isMobile={false} />
      </div>

      {/* Notices */}
      {VerifyNotice}
      {GuestNotice}

      {/* Modals */}
      {VerifyModal}

      {creditsModalOpen && (
        <BuyCreditsModal open onClose={() => setCreditsModalOpen(false)} />
      )}

      {searchModalOpen && (
        <SearchModal open onClose={() => setSearchModalOpen(false)} />
      )}
    </>
  );
}
