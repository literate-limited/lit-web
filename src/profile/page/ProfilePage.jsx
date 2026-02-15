import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useUser } from "../../context/UserContext";
import { ThemeContext } from "../../utils/themes/ThemeContext";

import ProfileHeader from "../components/ProfileHeader.jsx";
import EmptyProfileState from "../components/EmptyProfileState.jsx";
import AddFeatureModal from "../modals/AddFeatureModal.jsx";
import ProfileModulesRenderer from "../modules/ProfileModulesRenderer.jsx";
import BookingSystemCreationWizard from "../../booking/BookingSystemCreationWizard";

const API_URL = import.meta.env.VITE_API_URL;

function safeId(u) {
  return u?._id || u?.id || null;
}

// Not enforced “deeply” yet, but DB-ready
function canSeeModule(moduleVisibility, { isSelf, isFriend, inviteAccess }) {
  if (isSelf) return true;
  const visibility = moduleVisibility || "public";
  if (visibility === "public") return true;
  if (visibility === "friends" || visibility === "friendsOnly") return isFriend;
  if (visibility === "invitations") return inviteAccess;
  if (visibility === "invites_friends") return inviteAccess || isFriend;
  return false;
}

export default function Profile() {
  const { handle: routeHandle } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userLoggedIn, user, setUser, updateAvatar } = useUser();
  const { currentTheme } = useContext(ThemeContext);

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [inviteAccess, setInviteAccess] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const inviteToken = searchParams.get("invite");

  // Friend request UI (same behavior as old profile)
  const [friendRequestStatus, setFriendRequestStatus] = useState("idle"); // idle | sending | sent | error
  const [friendRequestError, setFriendRequestError] = useState(null);

  // /profile or /profile/me -> redirect to own handle (or to login if unauthenticated)
  useEffect(() => {
    const isMeAlias = !routeHandle || routeHandle === "me";
    if (!isMeAlias) return;
    if (userLoggedIn && user?.handle) {
      navigate(`/profile/${user.handle}`, { replace: true });
      return;
    }
    if (!userLoggedIn) {
      navigate("/login?redirect=/profile", { replace: true });
      return;
    }
    // Logged in but no handle yet: show self profile
    setProfileUser(user ? { ...user, _id: user._id || user.id } : null);
    setLoading(false);
  }, [routeHandle, userLoggedIn, user?.handle, navigate, user]);

  // Load profile user by handle (use context user if self)
  useEffect(() => {
    if (!routeHandle || routeHandle === "me") return;

    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    // Fast-path: self
    if (userLoggedIn && user?.handle && routeHandle === user.handle) {
      setProfileUser(user);
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/users/handle/${encodeURIComponent(routeHandle)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load profile");
        }
        setProfileUser(data.user ? { ...data.user, _id: data.user._id || data.user.id } : null);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("Profile load error:", err);
        setLoadError(err.message || "Error loading profile");
        setProfileUser(null);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [routeHandle, userLoggedIn, user]);

  useEffect(() => {
    let cancelled = false;
    if (!inviteToken || !routeHandle) {
      setInviteAccess(false);
      setInviteError("");
      return;
    }

    const validateInvite = async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/invitations/validate/${encodeURIComponent(inviteToken)}`
        );
        if (!data?.success) {
          setInviteAccess(false);
          setInviteError("Invite not valid.");
          return;
        }
        const inviterHandleRaw =
          data.invitation?.inviter?.handle || data.invitation?.inviter?.name;
        const inviterHandle = String(inviterHandleRaw || "").toLowerCase();
        const matchesHost =
          inviterHandle &&
          inviterHandle === String(routeHandle).toLowerCase();
        if (!cancelled) {
          setInviteAccess(Boolean(matchesHost));
          setInviteError(matchesHost ? "" : "Invite not valid for this profile.");
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 410) {
          setInviteAccess(false);
          setInviteError("Invite expired.");
          return;
        }
        if (!cancelled) {
          setInviteAccess(false);
          setInviteError("Invite not valid.");
        }
      }
    };

    validateInvite();

    return () => {
      cancelled = true;
    };
  }, [inviteToken, routeHandle]);

  const isSelf = useMemo(() => {
    if (!userLoggedIn || !user || !profileUser) return false;
    const a = String(safeId(user) ?? "");
    const b = String(safeId(profileUser) ?? "");
    return a && b && a === b;
  }, [userLoggedIn, user, profileUser]);

  const isFriend = useMemo(() => {
    if (!userLoggedIn || !user || !profileUser || isSelf) return false;
    const friendIds = Array.isArray(profileUser.friends) ? profileUser.friends : [];
    return friendIds.some((id) => String(id) === String(safeId(user)));
  }, [userLoggedIn, user, profileUser, isSelf]);

  // Placeholder view-mode logic (friend later)
  const viewMode = useMemo(() => {
    if (isSelf) return "self";
    if (inviteAccess) return "invite";
    if (isFriend) return "friend";
    if (!userLoggedIn) return "guest";
    return "nonFriend";
  }, [userLoggedIn, isSelf, isFriend, inviteAccess]);

  // SELF-only modules persisted in localStorage
  const storageKey = useMemo(() => {
    if (!isSelf) return null;
    const id = safeId(user) || user?.handle || "me";
    return `profileModules:${id}`;
  }, [isSelf, user]);

  const [modules, setModules] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    if (!isSelf || !storageKey) {
      setModules([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setModules(Array.isArray(parsed) ? parsed : []);
    } catch {
      setModules([]);
    }
  }, [isSelf, storageKey]);

  useEffect(() => {
    if (!isSelf || !storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(modules));
    } catch {
      // ignore
    }
  }, [modules, isSelf, storageKey]);

  const effectiveModules = useMemo(() => {
    const list = Array.isArray(modules) ? [...modules] : [];
    if (profileUser?.bookingEnabled) {
      const hasBooking = list.some((m) => m?.type === "booking");
      if (!hasBooking) {
        list.push({
          id: "booking",
          type: "booking",
          enabled: true,
          order: 10,
          visibility: profileUser.bookingVisibility || "public",
          config: {},
        });
      }
    }
    return list;
  }, [modules, profileUser?.bookingEnabled, profileUser?.bookingVisibility]);

  const filteredModules = useMemo(() => {
    const list = Array.isArray(effectiveModules) ? effectiveModules : [];
    return list.filter((m) => {
      if (!m || m.enabled === false) return false;
      return canSeeModule(m.visibility || "public", {
        isSelf,
        isFriend,
        inviteAccess,
      });
    });
  }, [effectiveModules, isSelf, isFriend, inviteAccess]);

  const disabledTypes = useMemo(() => {
    const set = new Set();
    (Array.isArray(effectiveModules) ? effectiveModules : []).forEach((m) => {
      if (m?.type && m?.enabled !== false) set.add(m.type);
    });
    return Array.from(set);
  }, [effectiveModules]);

  const addModule = (type) => {
    if (!isSelf) return;

    const already = effectiveModules.some(
      (m) => m?.type === type && m?.enabled !== false
    );
    if (already) return;

    if (type === "booking") {
      setWizardOpen(true);
      return;
    }

    const next = {
      id: `mod_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      type,
      enabled: true,
      order: (modules.length + 1) * 10,
      visibility: "public", // public | friendsOnly | private
      config: {},
    };

    setModules((prev) => [...prev, next]);
  };

  const handleAvatarChange = async (file) => {
    if (!file) return;
    setAvatarError("");
    setAvatarUploading(true);
    try {
      const updated = await updateAvatar(file);
      if (updated) {
        setUser(updated);
        setProfileUser((prev) =>
          prev && safeId(prev) === safeId(updated)
            ? { ...prev, profilePicture: updated.profilePicture }
            : prev
        );
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setAvatarError(err?.message || "Upload failed");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleProfileUpdate = (patch) => {
    setProfileUser((prev) => (prev ? { ...prev, ...patch } : prev));
    if (isSelf && typeof setUser === "function") {
      setUser((prev) => (prev ? { ...prev, ...patch } : prev));
    }
  };

  // Friend request (same backend route as old page)
  const sendFriend = async () => {
    if (!profileUser?._id) return;

    setFriendRequestStatus("sending");
    setFriendRequestError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/friend-request/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ toUserId: profileUser._id }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Failed to send friend request");
      }

      setFriendRequestStatus("sent");
    } catch (err) {
      console.error("friend request error:", err);
      setFriendRequestError(err?.message || "Error sending friend request");
      setFriendRequestStatus("error");
    }
  };

  if (loading) {
    return <div className="mt-28 text-center">Loading profile…</div>;
  }

  if (routeHandle && loadError) {
    return (
      <div className="mt-28 text-center text-red-600">
        {loadError || "Profile not found"}
      </div>
    );
  }

  // Guest without handle (/profile) — minimal placeholder
  if (!routeHandle && !userLoggedIn) {
    return (
      <div className="mt-28 text-center text-slate-600">
        No profile selected.
      </div>
    );
  }

  // If fetch is blocked for guests, still show something (but your header stays visible)
  const displayUser =
    profileUser ||
    (routeHandle
      ? { name: "Unknown user", handle: routeHandle, email: "", lit: 0 }
      : user);

  const showAddFriend =
    userLoggedIn && !isSelf && Boolean(profileUser?._id); // only when we have a real target user

  return (
    <div className="mt-24 sm:mt-28 pb-16">
      <div className="mx-5 sm:mx-20">
        <ProfileHeader
          profileUser={displayUser}
          isSelf={isSelf}
          viewMode={viewMode}
          currentTheme={currentTheme}
          onAvatarChange={handleAvatarChange}
          onProfileUpdate={handleProfileUpdate}
          avatarUploading={avatarUploading}
          avatarError={avatarError}
          showAddFriend={showAddFriend}
          friendRequestStatus={friendRequestStatus}
          friendRequestError={friendRequestError}
          onSendFriend={sendFriend}
        />

        <div className="mt-10">
          {inviteError && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {inviteError}
            </div>
          )}
          {filteredModules.length === 0 ? (
            <EmptyProfileState isSelf={isSelf} viewMode={viewMode} />
          ) : (
            <ProfileModulesRenderer
              modules={filteredModules}
              viewMode={viewMode}
              profileUser={profileUser}
              viewer={user}
              inviteToken={inviteToken}
              inviteAccess={inviteAccess}
              onProfileUpdate={handleProfileUpdate}
            />
          )}
        </div>
      </div>

      {/* SELF-only floating + */}
      {isSelf && (
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          aria-label="Add feature"
          className="
            fixed bottom-6 right-6 z-50
            w-14 h-14 rounded-full shadow-xl
            bg-cyan-600 hover:bg-cyan-700
            text-white text-3xl font-bold
            flex items-center justify-center
            group
          "
          title="Add feature"
        >
          +
          <span
            className="
              pointer-events-none
              absolute bottom-16 right-0
              whitespace-nowrap
              px-3 py-1 rounded-lg
              bg-black/80 text-white text-xs
              opacity-0 group-hover:opacity-100
              transition-opacity
            "
          >
            Add feature
          </span>
        </button>
      )}

      <AddFeatureModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        disabledTypes={disabledTypes}
        onAdd={(type) => {
          addModule(type);
          setAddOpen(false);
        }}
      />

      <BookingSystemCreationWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={(payload) => {
          handleProfileUpdate({
            bookingEnabled: true,
            bookingVisibility: payload?.bookingVisibility || "public",
          });
        }}
      />
    </div>
  );
}
