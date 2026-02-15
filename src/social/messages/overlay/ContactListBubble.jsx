// src/social/messages/overlay/ContactListBubble.jsx
import { useState, useEffect, useContext, useMemo, useRef } from "react";
import { FiMessageCircle, FiX, FiSearch } from "react-icons/fi";
import { ThemeContext } from "../../../utils/themes/ThemeContext";
import { useUser } from "../../../context/UserContext";
import { useChatOverlay } from "./ChatOverlayContext";

const getUserId = (u) => u?._id || u?.id || "";

const API_URL = import.meta.env.VITE_API_URL;

export default function ContactListBubble({
  onlineUsers,
  isTtv = false,
  onPillDragStart,
  onPillDragMove,
  onPillDragEnd,
}) {
  const { user } = useUser();
  const { contactListOpen, toggleContactList, closeContactList, openChat } =
    useChatOverlay();
  const { currentTheme, theme } = useContext(ThemeContext) || {};

  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const styles = useMemo(() => {
    const t = theme || {};
    const legacy = currentTheme || {};

    return {
      border: t?.border?.default ?? legacy?.floatMenuBorder ?? "rgba(0,0,0,0.12)",
      panelBg: t?.surface?.container ?? legacy?.containerColor ?? "#ffffff",
      headerBg: t?.surface?.header ?? legacy?.headerBg ?? "#f9fafb",
      listBg: t?.surface?.app ?? legacy?.settingsBg ?? "#f3f4f6",
      textPrimary: t?.text?.primary ?? legacy?.mainTextColor ?? "#111827",
      textSecondary: t?.text?.secondary ?? legacy?.grayText ?? "#6b7280",
      textInverse: t?.text?.inverse ?? "#ffffff",
      actionPrimary: t?.action?.primary ?? legacy?.buttonColor ?? "#2563eb",
      hoverBg: t?.action?.selected ?? "#e5e7eb",
    };
  }, [theme, currentTheme]);

  const dragStateRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    moved: false,
  });
  const suppressClickRef = useRef(false);
  const DRAG_THRESHOLD = 4;

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    suppressClickRef.current = false;
    onPillDragStart?.();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (event.pointerId !== dragStateRef.current.pointerId) return;
    const dx = event.clientX - dragStateRef.current.startX;
    const dy = event.clientY - dragStateRef.current.startY;
    const distance = Math.hypot(dx, dy);
    if (!dragStateRef.current.moved && distance > DRAG_THRESHOLD) {
      dragStateRef.current.moved = true;
      suppressClickRef.current = true;
    }
    if (dragStateRef.current.moved) {
      onPillDragMove?.(dx, dy);
    }
  };

  const handlePointerUp = (event) => {
    if (event.pointerId !== dragStateRef.current.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    onPillDragEnd?.();
    dragStateRef.current.pointerId = null;
  };

  const handlePointerCancel = (event) => {
    if (event.pointerId !== dragStateRef.current.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    onPillDragEnd?.();
    dragStateRef.current.pointerId = null;
  };
  // Load friends
  useEffect(() => {
    if (!getUserId(user) || !token) return;

    const loadFriends = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/friends`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (data?.success) {
          const friendList = (data.friends || []).filter(
            (u) => getUserId(u) !== getUserId(user)
          );
          setFriends(friendList);
        }
      } catch (err) {
        console.error("Failed to load friends:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [getUserId(user), token]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase();
    return friends.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        f.email?.toLowerCase().includes(q)
    );
  }, [friends, searchQuery]);

  const handleSelectContact = (contact) => {
    openChat({ ...contact, _id: getUserId(contact) }, null); // chatId will be created in ChatBubble
    closeContactList();
  };

  const handlePillClick = (event) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
      return;
    }
    toggleContactList();
  };

  // Collapsed bubble
  if (!contactListOpen) {
    const pillClassName = [
      "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105",
      isTtv ? "ttv-pill" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const pillStyle = isTtv
      ? { color: "#ffffff" }
      : {
          backgroundColor: styles.actionPrimary,
          color: styles.textInverse,
          border: "none",
        };

    const iconColor = isTtv ? "#ffffff" : styles.textInverse;

    return (
      <button
        type="button"
        onClick={handlePillClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={pillClassName}
        style={pillStyle}
        title="Open Contacts"
      >
        <FiMessageCircle size={24} color={iconColor} />
      </button>
    );
  }

  // Expanded contact list
  const panelClassName = [
    "w-72 h-96 rounded-lg shadow-lg flex flex-col overflow-hidden",
    isTtv ? "ttv-surface" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const panelStyle = isTtv
    ? { border: "1px solid rgba(255, 255, 255, 0.25)" }
    : {
        backgroundColor: styles.panelBg,
        border: `1px solid ${styles.border}`,
      };

  return (
    <div className={panelClassName} style={panelStyle}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ backgroundColor: styles.headerBg, borderBottom: `1px solid ${styles.border}` }}
      >
        <span className="font-semibold text-sm" style={{ color: styles.textPrimary }}>
          Contacts
        </span>
        <button
          onClick={closeContactList}
          className="p-1.5 rounded hover:bg-black/10 transition"
        >
          <FiX size={16} style={{ color: styles.textPrimary }} />
        </button>
      </div>

      {/* Search */}
      <div className="p-2" style={{ borderBottom: `1px solid ${styles.border}` }}>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: styles.listBg }}
        >
          <FiSearch size={14} style={{ color: styles.textSecondary }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: styles.textPrimary }}
          />
        </div>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm" style={{ color: styles.textSecondary }}>
            Loading...
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="p-4 text-center text-sm" style={{ color: styles.textSecondary }}>
            {searchQuery ? "No matches found" : "No contacts yet"}
          </div>
        ) : (
          filteredFriends.map((friend) => {
            const isOnline = onlineUsers?.has?.(getUserId(friend));

            return (
              <button
                key={getUserId(friend)}
                onClick={() => handleSelectContact(friend)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                style={{ backgroundColor: "transparent" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = styles.hoverBg)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <div className="relative">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: styles.actionPrimary,
                      color: styles.textInverse,
                    }}
                  >
                    {friend.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="font-medium text-sm truncate"
                    style={{ color: styles.textPrimary }}
                  >
                    {friend.name}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: styles.textSecondary }}
                  >
                    {isOnline ? "Active now" : friend.email}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
