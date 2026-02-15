import { useMemo, useRef, useState } from "react";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
  return "?";
}

const SOCIAL_ICONS = {
  twitter: "𝕏",
  x: "𝕏",
  instagram: "📷",
  linkedin: "in",
  github: "⌨",
  youtube: "▶",
  tiktok: "♪",
  facebook: "f",
  website: "🌐",
  default: "🔗",
};

function getSocialIcon(label) {
  const key = String(label || "").toLowerCase();
  return SOCIAL_ICONS[key] || SOCIAL_ICONS.default;
}

export default function ProfileHeader({
  profileUser,
  isSelf,
  viewMode,
  currentTheme,
  onAvatarChange,
  onBannerChange,
  onProfileUpdate,
  avatarUploading = false,
  avatarError = "",

  // friend request props
  showAddFriend = false,
  friendRequestStatus = "idle",
  friendRequestError = null,
  onSendFriend,
}) {
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerError, setBannerError] = useState("");

  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(profileUser?.bio || "");
  const [savingBio, setSavingBio] = useState(false);

  const bgColor = useMemo(() => {
    const s = String(profileUser?.handle || profileUser?.name || "x");
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    const hex = (hash & 0xffffff).toString(16).padStart(6, "0");
    return `#${hex}`;
  }, [profileUser?.handle, profileUser?.name]);

  const themeHeaderBg = currentTheme?.headerBg || "#e2e8f0";
  const themeInner = currentTheme?.innerContainerColor || "#ffffff";
  const themeText = currentTheme?.textColor || "#0f172a";
  const themeAccent = currentTheme?.headingTextColor || "#06b6d4";

  const pickAvatar = () => fileInputRef.current?.click();
  const pickBanner = () => bannerInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onAvatarChange?.(file);
    if (e.target) e.target.value = "";
  };

  const handleBannerFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (e.target) e.target.value = "";

    setBannerUploading(true);
    setBannerError("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await axios.put(`${API_URL}/users/me/banner`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (data?.bannerImage) {
        onProfileUpdate?.({ bannerImage: data.bannerImage });
      }
    } catch (err) {
      console.error("Banner upload failed:", err);
      setBannerError(err?.response?.data?.message || "Upload failed");
    } finally {
      setBannerUploading(false);
    }
  };

  const saveBio = async () => {
    try {
      setSavingBio(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.put(
        `${API_URL}/me/profile`,
        { bio: bioInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onProfileUpdate?.({ bio: data.bio ?? bioInput });
      setEditingBio(false);
    } catch (err) {
      console.error("Bio save failed:", err);
    } finally {
      setSavingBio(false);
    }
  };

  const socialLinks = Array.isArray(profileUser?.socialLinks) ? profileUser.socialLinks : [];
  const skills = Array.isArray(profileUser?.skills) ? profileUser.skills : [];
  const interests = Array.isArray(profileUser?.interests) ? profileUser.interests : [];

  const memberSince = profileUser?.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;

  return (
    <div className="relative">
      {/* Cover Photo Banner */}
      <div
        className="relative w-full h-32 sm:h-48 rounded-t-xl overflow-hidden"
        style={{
          backgroundColor: profileUser?.bannerImage ? "transparent" : bgColor,
          backgroundImage: profileUser?.bannerImage ? `url(${profileUser.bannerImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Banner upload button (self only) */}
        {isSelf && (
          <>
            <button
              type="button"
              onClick={pickBanner}
              disabled={bannerUploading}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white text-xs font-medium backdrop-blur-sm transition"
            >
              {bannerUploading ? "Uploading…" : profileUser?.bannerImage ? "Change cover" : "Add cover photo"}
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerFileChange}
            />
          </>
        )}

        {bannerError && (
          <div className="absolute bottom-2 right-2 text-xs text-red-300 bg-black/50 px-2 py-1 rounded">
            {bannerError}
          </div>
        )}
      </div>

      {/* Main Header Content */}
      <div
        style={{ backgroundColor: themeHeaderBg, borderColor: themeHeaderBg }}
        className="relative border border-t-0 rounded-b-xl p-4 sm:p-6"
      >
        {/* Avatar - positioned to overlap banner */}
        <div className="absolute -top-12 sm:-top-16 left-4 sm:left-6">
          <div
            onClick={isSelf ? pickAvatar : undefined}
            role={isSelf ? "button" : "img"}
            tabIndex={isSelf ? 0 : -1}
            className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full text-white font-bold text-3xl flex items-center justify-center select-none overflow-hidden border-4 border-white shadow-lg ${
              isSelf ? "cursor-pointer hover:opacity-90" : ""
            }`}
            style={{ backgroundColor: bgColor }}
            title={isSelf ? (avatarUploading ? "Uploading…" : "Change avatar") : undefined}
          >
            {profileUser?.profilePicture ? (
              <img
                src={profileUser.profilePicture}
                alt={profileUser?.name || "Avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              getInitials(profileUser?.name)
            )}
          </div>

          {isSelf && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          )}
        </div>

        {/* Content with padding for avatar */}
        <div className="pt-4">
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            {/* Left: Identity & Bio */}
            <div className="flex-1 min-w-0">
              {/* Name & Badge Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  style={{ color: themeText }}
                  className="text-2xl sm:text-3xl font-bold truncate"
                >
                  {profileUser?.name || "Unnamed"}
                </h1>
                <span className="text-xs px-2 py-1 rounded-full border border-slate-300 text-slate-600">
                  {viewMode}
                </span>
              </div>

              {/* Handle Row */}
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-slate-700">
                  <span role="img" aria-label="fire">🔥</span>{" "}
                  <span className="font-semibold">@{profileUser?.handle || "no_handle"}</span>
                </span>
              </div>

              {avatarError && <div className="text-xs text-red-600 mt-1">{avatarError}</div>}

              {/* Bio Section */}
              <div className="mt-3">
                {editingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Tell people about yourself..."
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveBio}
                        disabled={savingBio}
                        className="px-3 py-1 rounded bg-green-600 text-white text-sm disabled:opacity-60"
                      >
                        {savingBio ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingBio(false);
                          setBioInput(profileUser?.bio || "");
                        }}
                        className="px-3 py-1 rounded border border-slate-300 text-sm hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <span className="text-xs text-slate-400 ml-auto">{bioInput.length}/500</span>
                    </div>
                  </div>
                ) : (
                  <div className="group">
                    {profileUser?.bio ? (
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{profileUser.bio}</p>
                    ) : isSelf ? (
                      <p className="text-sm text-slate-400 italic">No bio yet. Click to add one.</p>
                    ) : null}
                    {isSelf && (
                      <button
                        onClick={() => {
                          setBioInput(profileUser?.bio || "");
                          setEditingBio(true);
                        }}
                        className="text-xs text-cyan-600 hover:text-cyan-700 mt-1"
                      >
                        {profileUser?.bio ? "Edit bio" : "Add bio"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {socialLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm transition"
                      title={link.label}
                    >
                      <span>{getSocialIcon(link.label)}</span>
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-slate-500 mb-1">Skills</div>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests */}
              {interests.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-slate-500 mb-1">Interests</div>
                  <div className="flex flex-wrap gap-1.5">
                    {interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Friend Button */}
              {showAddFriend && (
                <div className="mt-4">
                  <button
                    onClick={onSendFriend}
                    disabled={friendRequestStatus === "sending" || friendRequestStatus === "sent"}
                    className="px-4 py-2 rounded-lg text-white text-sm font-semibold bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60"
                  >
                    {friendRequestStatus === "idle" && "Add friend"}
                    {friendRequestStatus === "sending" && "Sending…"}
                    {friendRequestStatus === "sent" && "Request sent ✔"}
                    {friendRequestStatus === "error" && "Try again"}
                  </button>

                  {friendRequestError && (
                    <div className="text-xs text-red-600 mt-1">{friendRequestError}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
