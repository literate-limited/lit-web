// src/social/messages/overlay/ChatBubble.jsx
import { useState, useEffect, useRef, useContext, useMemo } from "react";
import { FiX, FiMinus, FiPhone, FiVideo } from "react-icons/fi";
import { ThemeContext } from "../../../utils/themes/ThemeContext";
import { useUser } from "../../../context/UserContext";
import { useChatOverlay } from "./ChatOverlayContext";
import CallModal from "./CallModal";

const getUserId = (u) => u?._id || u?.id || "";

const API_URL = import.meta.env.VITE_API_URL;

export default function ChatBubble({
  chatUser,
  chatId: initialChatId,
  socketMessages, // messages from socket (real-time updates)
  typingUsers,
  onlineUsers,
  joinChat,
  sendMessage,
  setTyping,
  startVideoCall,
  endVideoCall,
  startAudioCall,
  endAudioCall,
}) {
  const { user } = useUser();
  const { closeChat, minimizeChat, updateChatId } = useChatOverlay();
  const { currentTheme, theme } = useContext(ThemeContext) || {};

  const [newMsg, setNewMsg] = useState("");
  const [chatId, setChatId] = useState(initialChatId);
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState(null); // "audio" | "video"
  const [localMessages, setLocalMessages] = useState([]); // history + local state
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
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
      bubbleMeBg: t?.action?.primary ?? legacy?.buttonColor ?? "#2563eb",
      bubbleMeText: t?.text?.inverse ?? "#ffffff",
      bubbleOtherBg: t?.surface?.containerSubtle ?? "#e5e7eb",
      bubbleOtherText: t?.text?.primary ?? "#111827",
    };
  }, [theme, currentTheme]);

  // Get or create chat when component mounts
  useEffect(() => {
    if (!getUserId(chatUser) || !getUserId(user) || !token) return;

    const initChat = async () => {
      try {
        let currentChatId = chatId;

        if (!currentChatId) {
          const res = await fetch(`${API_URL}/chat/get-or-create`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ user1: getUserId(user), user2: getUserId(chatUser) }),
          });
          const data = await res.json();
          currentChatId = data.chatId;
          setChatId(currentChatId);
          updateChatId(getUserId(chatUser), currentChatId);
        }

        if (currentChatId) {
          joinChat(currentChatId);

          // Load message history
          const historyRes = await fetch(
            `${API_URL}/chat/${currentChatId}/messages`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const history = await historyRes.json();
          const historyMsgs = history?.messages || [];
          setLocalMessages(historyMsgs);
        }
      } catch (err) {
        console.error("ChatBubble init error:", err);
      }
    };

    initChat();
  }, [getUserId(chatUser), getUserId(user), token]);

  // Sync new messages from socket to local state
  useEffect(() => {
    if (!socketMessages || socketMessages.length === 0 || !chatId) return;

    const incoming = socketMessages.filter((msg) => msg.chatId === chatId);
    if (incoming.length === 0) return;

    setLocalMessages((prev) => {
      let next = [...prev];
      incoming.forEach((msg) => {
        const existingIndex = next.findIndex((m) => m._id === msg._id);
        if (existingIndex !== -1) return;

        const pendingIndex = next.findIndex(
          (m) =>
            m.__pending &&
            m.chatId === msg.chatId &&
            m.senderId === msg.senderId &&
            m.content === msg.content
        );

        if (pendingIndex !== -1) {
          next[pendingIndex] = msg;
          return;
        }

        next.push(msg);
      });
      return next;
    });
  }, [socketMessages, chatId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleSend = async () => {
    if (!newMsg.trim() || !chatId) return;
    try {
      await sendMessage({ chatId, content: newMsg });
      setNewMsg("");
    } catch (err) {
      console.error("Send error:", err);
    }
  };

  const handleTyping = (value) => {
    setNewMsg(value);
    if (!chatId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (value.trim().length === 0) {
      setTyping({ chatId, isTyping: false });
    } else {
      setTyping({ chatId, isTyping: true });
      typingTimeoutRef.current = setTimeout(() => {
        setTyping({ chatId, isTyping: false });
      }, 2000);
    }
  };

  const isOnline = onlineUsers?.has?.(getUserId(chatUser));

  const handleStartAudioCall = () => {
    if (!chatId) return;
    startAudioCall?.({
      chatId,
      roomId: chatId,
      receiverId: getUserId(chatUser),
    });
    setCallType("audio");
    setCallActive(true);
  };

  const handleStartVideoCall = () => {
    if (!chatId) return;
    startVideoCall?.({
      chatId,
      roomId: chatId,
      receiverId: getUserId(chatUser),
    });
    setCallType("video");
    setCallActive(true);
  };

  const handleCloseCall = () => {
    setCallActive(false);
    setCallType(null);
  };

  // Messages for this chat (already filtered by chatId in the sync effect)
  const chatMessages = localMessages;

  return (
    <div
      className="w-80 h-96 flex flex-col rounded-t-lg shadow-lg overflow-hidden"
      style={{ backgroundColor: styles.panelBg, border: `1px solid ${styles.border}` }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer"
        style={{ backgroundColor: styles.headerBg, borderBottom: `1px solid ${styles.border}` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: styles.actionPrimary, color: styles.textInverse }}
            >
              {chatUser.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
          <span
            className="font-semibold truncate text-sm"
            style={{ color: styles.textPrimary }}
          >
            {chatUser.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleStartAudioCall}
            disabled={!chatId}
            className="p-1.5 rounded hover:bg-black/10 transition disabled:opacity-40"
            title="Audio call"
          >
            <FiPhone size={14} style={{ color: styles.textPrimary }} />
          </button>
          <button
            onClick={handleStartVideoCall}
            disabled={!chatId}
            className="p-1.5 rounded hover:bg-black/10 transition disabled:opacity-40"
            title="Video call"
          >
            <FiVideo size={14} style={{ color: styles.textPrimary }} />
          </button>
          <button
            onClick={() => minimizeChat(getUserId(chatUser))}
            className="p-1.5 rounded hover:bg-black/10 transition"
            title="Minimize"
          >
            <FiMinus size={14} style={{ color: styles.textPrimary }} />
          </button>
          <button
            onClick={() => closeChat(getUserId(chatUser))}
            className="p-1.5 rounded hover:bg-black/10 transition"
            title="Close"
          >
            <FiX size={14} style={{ color: styles.textPrimary }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-2"
        style={{ backgroundColor: styles.listBg }}
      >
        {chatMessages.map((msg, idx) => {
          const isMe = msg.senderId === getUserId(user);

          // Handle call events
          if (msg.type?.includes("call")) {
            return (
              <div key={msg._id || idx} className="flex justify-center">
                <span
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: styles.bubbleOtherBg, color: styles.textSecondary }}
                >
                  {msg.type.includes("started") ? "Call started" : "Call ended"}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg._id || idx}
              className={`max-w-[75%] p-2 rounded-lg text-sm break-words ${
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

        {chatId && typingUsers[chatId]?.length > 0 && (
          <p className="text-xs italic" style={{ color: styles.textSecondary }}>
            Typing...
          </p>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="p-2 flex gap-2"
        style={{ borderTop: `1px solid ${styles.border}`, backgroundColor: styles.panelBg }}
      >
        <input
          type="text"
          value={newMsg}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Aa"
          className="flex-1 px-3 py-1.5 rounded-full text-sm outline-none"
          style={{
            backgroundColor: styles.listBg,
            border: `1px solid ${styles.border}`,
            color: styles.textPrimary,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!chatId || !newMsg.trim()}
          className="px-3 py-1.5 rounded-full text-sm font-medium transition disabled:opacity-50"
          style={{ backgroundColor: styles.actionPrimary, color: styles.textInverse }}
        >
          Send
        </button>
      </div>

      {/* Call Modal */}
      <CallModal
        isOpen={callActive}
        callType={callType}
        roomId={chatId}
        chatId={chatId}
        userName={user?.name}
        otherUser={chatUser}
        onClose={handleCloseCall}
        endVideoCall={endVideoCall}
        endAudioCall={endAudioCall}
      />
    </div>
  );
}
