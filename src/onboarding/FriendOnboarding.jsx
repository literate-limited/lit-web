import { useContext, useMemo, useState } from "react";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { ThemeContext } from "../utils/themes/ThemeContext";
import { useBrand } from "../brands/BrandContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function FriendOnboarding({ invite, inviteToken, onDone }) {
  const inviter = invite?.inviter;
  const inviterName = inviter?.name || (inviter?.handle ? `@${inviter.handle}` : "the referrer");
  const { theme, currentTheme } = useContext(ThemeContext);
  const { brand } = useBrand();
  const appName = brand?.name || "Lit";

  const [acceptInviterFriend, setAcceptInviterFriend] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const initial = useMemo(() => {
    const rows = (invite?.suggestedFriends || []).map((u) => ({
      _id: u._id,
      name: u.name,
      handle: u.handle,
      selected: true,
    }));
    return rows;
  }, [invite]);

  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState(false);

  const toggleRow = (id) => {
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, selected: !r.selected } : r)));
  };

  const save = async () => {
    // confirm if they said "no"
    if (!acceptInviterFriend) {
      const ok = window.confirm(
        `Are you sure you don't want to be friends with ${inviterName} on ${appName}?`
      );
      if (!ok) return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const token = localStorage.getItem("token");
      const selectedFriendIds = rows.filter((r) => r.selected).map((r) => r._id);

      const res = await fetch(`${API_URL}/invitations/${encodeURIComponent(inviteToken)}/friend-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ acceptInviterFriend, selectedFriendIds }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed");

      if (!acceptInviterFriend) {
        setNotice("Alright then - if you change your mind, check your friend requests later.");
      }

      onDone?.();
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to save friend onboarding.");
    } finally {
      setSaving(false);
    }
  };

  const pageBg = theme?.surface?.app ?? currentTheme?.backgroundColor ?? "#0b0703";
  const cardBg = theme?.surface?.container ?? currentTheme?.headerBg ?? "#f3e7c3";
  const cardBorder = theme?.border?.default ?? currentTheme?.floatMenuBorder ?? "#b67b2c";
  const textPrimary = theme?.text?.primary ?? currentTheme?.mainTextColor ?? "#2a1c0f";
  const textSecondary = theme?.text?.secondary ?? currentTheme?.grayText ?? "#4a3523";
  const accent = theme?.action?.primary ?? currentTheme?.buttonColor ?? "#2a1c0f";
  const inverseText = theme?.text?.inverse ?? currentTheme?.buttonText ?? "#f3e7c3";
  const surfaceInteractive = theme?.surface?.interactive ?? currentTheme?.innerContainerColor ?? "#f7edd1";
  const surfaceSubtle = theme?.surface?.containerSubtle ?? currentTheme?.placeholderBg ?? "#ffffff";
  const glow =
    accent && accent.startsWith("#") && accent.length === 7
      ? `${accent}55`
      : "rgba(0,0,0,0.2)";
  const successText = theme?.feedback?.successText ?? "#15803d";
  const errorText = theme?.feedback?.errorText ?? "#b91c1c";

  return (
    <section
      className="min-h-screen w-full flex items-center justify-center p-6 relative"
      style={{ backgroundColor: pageBg, color: textPrimary }}
    >
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-3xl">
        <div
          className="rounded-xl p-6 sm:p-7"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, boxShadow: `0 0 35px ${glow}` }}
        >
          <div className="flex items-center gap-3 mb-4">
            <img className="h-12 w-12" src={brand?.logo} alt={appName} />
            <div>
              <div className="text-xl font-bold">Connect with Friends</div>
              <div className="text-sm opacity-70" style={{ color: textSecondary }}>
                Invite from {inviterName}
              </div>
            </div>
          </div>

          <div className="text-sm opacity-80 mb-4" style={{ color: textSecondary }}>
            You have been invited to {appName} by{" "}
            <span className="font-semibold">{inviterName}</span>.<br />
            Do you wish to accept {inviterName}'s friendship and become their friend and contact?
          </div>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              className="px-4 py-2 rounded-full border text-sm font-semibold transition-all hover:opacity-90"
              style={{
                borderColor: acceptInviterFriend ? accent : cardBorder,
                backgroundColor: acceptInviterFriend ? surfaceInteractive : surfaceSubtle,
                color: textPrimary,
              }}
              onClick={() => setAcceptInviterFriend(true)}
            >
              Yes
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-full border text-sm font-semibold transition-all hover:opacity-90"
              style={{
                borderColor: !acceptInviterFriend ? accent : cardBorder,
                backgroundColor: !acceptInviterFriend ? surfaceInteractive : surfaceSubtle,
                color: textPrimary,
              }}
              onClick={() => setAcceptInviterFriend(false)}
            >
              No
            </button>
          </div>

          {rows.length > 0 && (
            <div className="mb-6">
            <div className="font-semibold mb-2">
              {inviterName} has indicated that you also know these people on {appName}. Do you?
            </div>

              <div className="rounded-xl border overflow-hidden" style={{ borderColor: cardBorder }}>
                <div className="grid grid-cols-12 px-3 py-2 text-xs font-semibold" style={{ color: textSecondary }}>
                  <div className="col-span-2">Selected?</div>
                  <div className="col-span-5">Name</div>
                  <div className="col-span-5">Handle</div>
                </div>

                {rows.map((r) => (
                  <div
                    key={r._id}
                    className="grid grid-cols-12 px-3 py-2 border-t items-center"
                    style={{ borderColor: cardBorder }}
                  >
                    <div className="col-span-2">
                      <button
                        type="button"
                        className="px-3 py-1 rounded-full border text-xs font-semibold"
                        style={{ borderColor: cardBorder, color: textPrimary }}
                        onClick={() => toggleRow(r._id)}
                      >
                        {r.selected ? "✓" : "✕"}
                      </button>
                    </div>
                    <div className="col-span-5 text-sm font-semibold">{r.name}</div>
                    <div className="col-span-5 text-sm opacity-70" style={{ color: textSecondary }}>
                      @{r.handle}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notice && (
            <div className="text-sm mb-4" style={{ color: successText }}>{notice}</div>
          )}
          {error && (
            <div className="text-sm mb-4" style={{ color: errorText }}>{error}</div>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-6 py-3 rounded-full font-semibold shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
            style={{ backgroundColor: accent, color: inverseText, boxShadow: `0 0 20px ${glow}` }}
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </section>
  );
}
