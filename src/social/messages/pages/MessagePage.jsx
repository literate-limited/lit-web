import { useEffect, useState, useRef, useContext, useMemo } from "react";
import useChatSocket from "../hooks/UseChatSocket";
import { useUser } from "../../../context/UserContext";
import { ThemeContext } from "../../../utils/themes/ThemeContext";

import { FiPhone, FiVideo } from "react-icons/fi";
import { FaArrowLeft } from "react-icons/fa";

import VideoCall from "../components/VideoCall";
import AudioCall from "../components/AudioCall";
import IncomingCallModal from "../components/IncomingCallModal";

const Message = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // WhatsApp mobile nav
  const [view, setView] = useState("contacts"); // "contacts" | "chat"

  const [newMsg, setNewMsg] = useState("");
  const [videoCall, setVideoCall] = useState(false);
  const [audioCall, setAudioCall] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { user } = useUser();
  const { currentTheme, theme } = useContext(ThemeContext) || {};

  const {
    messages,
    typingUsers,
    onlineUsers,
    joinChat,
    sendMessage,
    setTyping,
    setMessages,
    startVideoCall,
    endVideoCall,
    startAudioCall,
    endAudioCall,
    incomingCall,
    setIncomingCall,
    acceptCall,
  } = useChatSocket({
    token,
    baseUrl: import.meta.env.VITE_SOCKET_URL || "http://localhost:8000",
    userId: user?._id,
  });

  // --- Token-first styling (with legacy fallbacks) ---
  const styles = useMemo(() => {
    const t = theme || {};
    const legacy = currentTheme || {};

    const border = t?.border?.default ?? legacy?.floatMenuBorder ?? "rgba(0,0,0,0.12)";
    const appBg = t?.surface?.app ?? legacy?.backgroundColor ?? "#f3f4f6";
    const panelBg = t?.surface?.container ?? legacy?.containerColor ?? "#ffffff";
    const headerBg = t?.surface?.header ?? legacy?.headerBg ?? "#f9fafb";
    const listBg = t?.surface?.app ?? legacy?.settingsBg ?? "#f3f4f6";
    const inputBg = t?.surface?.containerSubtle ?? legacy?.containerColor ?? "#ffffff";

    const textPrimary =
      t?.text?.primary ?? legacy?.mainTextColor ?? legacy?.textColor ?? "#111827";
    const textSecondary = t?.text?.secondary ?? legacy?.grayText ?? "#6b7280";
    const textInverse = t?.text?.inverse ?? "#ffffff";
    const heading = t?.text?.heading ?? textPrimary;

    const actionPrimary = t?.action?.primary ?? legacy?.buttonColor ?? "#2563eb";
    const actionHover = t?.action?.hover ?? actionPrimary;
    const actionSelected =
      t?.action?.selected ?? t?.surface?.interactive ?? legacy?.selectedOptionButton ?? "#e5e7eb";

    const bubbleMeBg = actionPrimary;
    const bubbleMeText = textInverse;

    const bubbleOtherBg = t?.surface?.containerSubtle ?? legacy?.containerColor ?? "#ffffff";
    const bubbleOtherText = textPrimary;

    const icon = t?.icon?.default ?? legacy?.iconColor ?? textPrimary;

    return {
      border,
      appBg,
      panelBg,
      headerBg,
      listBg,
      inputBg,
      textPrimary,
      textSecondary,
      textInverse,
      heading,
      actionPrimary,
      actionHover,
      actionSelected,
      bubbleMeBg,
      bubbleMeText,
      bubbleOtherBg,
      bubbleOtherText,
      icon,
    };
  }, [theme, currentTheme]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  async function getOrCreateChat(otherUserId) {
    const res = await fetch(`${API_URL}/chat/get-or-create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user1: user._id, user2: otherUserId }),
    });
    return res.json();
  }

  // Load friends
  useEffect(() => {
    if (!user?._id || !token) return;

    (async () => {
      try {
        const response = await fetch(`${API_URL}/friends`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data?.success) {
          const friends = (data.friends || []).filter((u) => u?._id !== user._id);
          setUsers(friends);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error("Friends fetch error", error);
      }
    })();
  }, [API_URL, token, user?._id]);

  // Join chat + load history when selectedUser changes
  useEffect(() => {
    if (!selectedUser?._id || !token || !user?._id) return;

    (async () => {
      try {
        // Clear immediately so you don’t see previous convo flash
        setMessages([]);

        let chatId = selectedUser.chatId;

        if (!chatId) {
          const created = await getOrCreateChat(selectedUser._id);
          chatId = created.chatId;
          setSelectedUser((prev) => ({ ...prev, ...created }));
        }

        joinChat(chatId);

        const res = await fetch(`${API_URL}/chat/${chatId}/messages`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const history = await res.json();
        setMessages(history?.messages || []);
      } catch (err) {
        console.error("History error:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser?._id]);

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setView("chat");
  };

  const handleBackToContacts = () => setView("contacts");

  const handleSend = async () => {
    if (!newMsg.trim() || !selectedUser?.chatId) return;
    try {
      await sendMessage({ chatId: selectedUser.chatId, content: newMsg });
      setNewMsg("");
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const startAudioCallData = () => {
    if (!selectedUser?.chatId) return;
    startAudioCall({
      chatId: selectedUser.chatId,
      roomId: selectedUser.chatId,
      receiverId: selectedUser._id,
    });
    setAudioCall(true);
  };

  const startVideoCallData = () => {
    if (!selectedUser?.chatId) return;
    startVideoCall({
      chatId: selectedUser.chatId,
      roomId: selectedUser.chatId,
      receiverId: selectedUser._id,
    });
    setVideoCall(true);
  };

  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;

    const { callerId, receiverId, chatId, callType } = incomingCall;

    const otherUser =
      users.find((u) => u._id === callerId) || users.find((u) => u._id === receiverId);

    if (otherUser) {
      setSelectedUser({ ...otherUser, chatId });
      setView("chat");
      if (callType === "video") setVideoCall(true);
      else setAudioCall(true);
    }

    acceptCall({ chatId, roomId: chatId, callerId, type: callType });
    setIncomingCall(null);
  };

  if (audioCall && selectedUser?.chatId) {
    return (
      <AudioCall
        roomId={selectedUser.chatId}
        userName={user.name}
        setAudioCall={setAudioCall}
        chatId={selectedUser.chatId}
        endAudioCall={endAudioCall}
      />
    );
  }

  if (videoCall && selectedUser?.chatId) {
    return (
      <VideoCall
        chatId={selectedUser.chatId}
        roomId={selectedUser.chatId}
        userName={user.name}
        setVideoCall={setVideoCall}
        endVideoCall={endVideoCall}
      />
    );
  }

  const showContactsMobile = view === "contacts";
  const showChatMobile = view === "chat";

  // Simple themed hover/selected for contacts
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div
      className="w-full max-w-full h-[calc(100dvh-64px)] flex overflow-hidden overflow-x-hidden"
      style={{ backgroundColor: styles.appBg }}
    >
      {/* CONTACTS */}
      <div
        className={[
          "border-r flex flex-col min-w-0 max-w-full",
          "md:w-1/3 md:flex",
          "w-full",
          showContactsMobile ? "flex" : "hidden",
          "md:flex",
        ].join(" ")}
        style={{ backgroundColor: styles.panelBg, borderColor: styles.border }}
      >
        <h2
          className="p-4 text-lg font-bold border-b w-full max-w-full"
          style={{
            backgroundColor: styles.headerBg,
            borderColor: styles.border,
            color: styles.heading,
          }}
        >
          Contacts
        </h2>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {users.map((u) => {
            const isSelected = selectedUser?._id === u._id;
            const isHovered = hoveredId === u._id;

            const bg = isSelected
              ? styles.actionSelected
              : isHovered
              ? styles.actionSelected
              : "transparent";

            return (
              <button
                type="button"
                key={u._id}
                onClick={() => handleSelectUser(u)}
                onMouseEnter={() => setHoveredId(u._id)}
                onMouseLeave={() => setHoveredId(null)}
                className="w-full text-left p-4 border-b transition-colors duration-150"
                style={{
                  borderColor: styles.border,
                  backgroundColor: bg,
                }}
              >
                <p className="font-semibold break-words" style={{ color: styles.textPrimary }}>
                  {u.name}
                </p>
                <p className="text-sm break-words" style={{ color: styles.textSecondary }}>
                  {u.email}
                </p>
              </button>
            );
          })}

          {users.length === 0 && (
            <div className="p-6 text-sm" style={{ color: styles.textSecondary }}>
              No friends yet.
            </div>
          )}
        </div>
      </div>

      {/* CHAT */}
      <div
        className={[
          "flex flex-col min-w-0 max-w-full",
          "md:w-2/3 md:flex",
          "w-full",
          showChatMobile ? "flex" : "hidden",
          "md:flex",
        ].join(" ")}
      >
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-lg" style={{ color: styles.textSecondary }}>
            Select a user to start chat
          </div>
        ) : (
          <>
            {/* HEADER (no horizontal overflow) */}
            <div
              className="w-full max-w-full shrink-0 p-4 border-b flex items-center justify-between gap-3 overflow-x-hidden"
              style={{
                backgroundColor: styles.headerBg,
                borderColor: styles.border,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={handleBackToContacts}
                  className="md:hidden p-2 -ml-2 rounded-full hover:opacity-90 transition"
                  title="Back"
                  style={{ color: styles.icon }}
                >
                  <FaArrowLeft size={18} />
                </button>

                <h3 className="font-bold text-lg truncate" style={{ color: styles.heading }}>
                  Chat with {selectedUser.name}
                </h3>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`hidden xs:inline text-sm font-medium ${
                    onlineUsers.has(selectedUser._id) ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ● {onlineUsers.has(selectedUser._id) ? "Online" : "Offline"}
                </span>

                <button
                  title="Audio Call"
                  className="p-2 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={startAudioCallData}
                  disabled={!selectedUser?.chatId}
                  style={{ color: styles.icon }}
                >
                  <FiPhone size={18} />
                </button>

                <button
                  title="Video Call"
                  className="p-2 rounded-full hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={startVideoCallData}
                  disabled={!selectedUser?.chatId}
                  style={{ color: styles.icon }}
                >
                  <FiVideo size={18} />
                </button>
              </div>
            </div>

            {/* MESSAGES (scrolls) */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-3"
              style={{ backgroundColor: styles.listBg }}
            >
              {(messages || []).map((msg, idx) => {
                const isMe = msg.senderId === user._id;

                const isCallStart =
                  msg.type === "video_call_started" || msg.type === "audio_call_started";
                const isCallEnd =
                  msg.type === "video_call_ended" || msg.type === "audio_call_ended";

                if (isCallStart) {
                  return (
                    <div key={idx} className="w-full flex justify-center my-2">
                      <div
                        className="px-4 py-2 rounded-full text-xs"
                        style={{ backgroundColor: styles.actionSelected, color: styles.textPrimary }}
                      >
                        {msg.type === "video_call_started"
                          ? "📹 Video call started"
                          : "🎧 Audio call started"}
                      </div>
                    </div>
                  );
                }

                if (isCallEnd) {
                  return (
                    <div key={idx} className="w-full flex justify-center my-2">
                      <div
                        className="px-4 py-2 rounded-full text-xs"
                        style={{ backgroundColor: styles.actionSelected, color: styles.textPrimary }}
                      >
                        {msg.type === "video_call_ended"
                          ? `📹 Video call ended (${msg.callMeta?.duration || 0} min)`
                          : `🎧 Audio call ended (${msg.callMeta?.duration || 0} min)`}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className={`max-w-[80%] sm:max-w-[70%] md:max-w-[60%] p-3 rounded-xl shadow-sm text-sm break-words ${
                      isMe ? "ml-auto" : ""
                    }`}
                    style={{
                      backgroundColor: isMe ? styles.bubbleMeBg : styles.bubbleOtherBg,
                      color: isMe ? styles.bubbleMeText : styles.bubbleOtherText,
                    }}
                  >
                    {msg.content}
                  </div>
                );
              })}

              {selectedUser?.chatId && typingUsers[selectedUser.chatId]?.length > 0 && (
                <p className="text-sm italic" style={{ color: styles.textSecondary }}>
                  Typing...
                </p>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT (glued to bottom) */}
            <div
              className="w-full max-w-full shrink-0 p-3 sm:p-4 border-t flex gap-3 items-center overflow-x-hidden"
              style={{
                backgroundColor: styles.inputBg,
                borderColor: styles.border,
              }}
            >
              <input
                type="text"
                value={newMsg}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewMsg(value);

                  if (!selectedUser?.chatId) return;

                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

                  if (value.trim().length === 0) {
                    setTyping({ chatId: selectedUser.chatId, isTyping: false });
                  } else {
                    setTyping({ chatId: selectedUser.chatId, isTyping: true });

                    typingTimeoutRef.current = setTimeout(() => {
                      setTyping({ chatId: selectedUser.chatId, isTyping: false });
                    }, 2000);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="min-w-0 flex-1 border rounded-full px-4 py-2 shadow-sm outline-none focus:ring-2"
                placeholder="Type a message..."
                style={{
                  backgroundColor: styles.panelBg,
                  borderColor: styles.border,
                  color: styles.textPrimary,
                }}
              />

              <button
                onClick={handleSend}
                className="shrink-0 px-5 sm:px-6 py-2 rounded-full shadow transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedUser?.chatId}
                style={{
                  backgroundColor: styles.actionPrimary,
                  color: styles.textInverse,
                }}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>

      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptIncomingCall}
          onReject={() => setIncomingCall(null)}
        />
      )}
    </div>
  );
};

export default Message;
