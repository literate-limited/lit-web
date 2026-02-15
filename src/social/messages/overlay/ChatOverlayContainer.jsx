// src/social/messages/overlay/ChatOverlayContainer.jsx
import { useContext, useMemo, useState, useRef } from "react";
import { useChatOverlay } from "./ChatOverlayContext";
import ChatBubble from "./ChatBubble";
import ContactListBubble from "./ContactListBubble";
import CallModal from "./CallModal";
import useChatSocket from "../hooks/UseChatSocket";
import { useUser } from "../../../context/UserContext";
import { ThemeContext } from "../../../utils/themes/ThemeContext";
import IncomingCallModal from "../components/IncomingCallModal";
import { useBrand } from "../../../brands/BrandContext";

const DRAG_LIMIT_X = 320;
const DRAG_LIMIT_Y = 240;
const getUserId = (u) => u?._id || u?.id || "";

export default function ChatOverlayContainer() {
  const { user } = useUser();
  const { openChats, restoreChat } = useChatOverlay();
  const { currentTheme, theme } = useContext(ThemeContext) || {};
  const { brandId } = useBrand();
  const isTtv = brandId === "ttv";

  const token = localStorage.getItem("token");

  // Single socket connection for all chats
  const {
    messages,
    typingUsers,
    onlineUsers,
    joinChat,
    sendMessage,
    setTyping,
    incomingCall,
    setIncomingCall,
    acceptCall,
    startVideoCall,
    endVideoCall,
    startAudioCall,
    endAudioCall,
  } = useChatSocket({
    token,
    baseUrl:
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, "")
        : null) ||
      "http://localhost:1212",
    userId: getUserId(user),
  });

  // Active incoming call that was accepted
  const [activeIncomingCall, setActiveIncomingCall] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const styles = useMemo(() => {
    const t = theme || {};
    const legacy = currentTheme || {};

    return {
      actionPrimary: t?.action?.primary ?? legacy?.buttonColor ?? "#2563eb",
      textInverse: t?.text?.inverse ?? "#ffffff",
      textPrimary: t?.text?.primary ?? "#111827",
    };
  }, [theme, currentTheme]);

  const overlayStyle = {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
    transition: isDragging ? "none" : "transform 0.15s ease",
    willChange: "transform",
  };

  const clamp = (value, limit) => Math.max(Math.min(value, limit), -limit);

  const handlePillDragStart = () => {
    setIsDragging(true);
    dragStartRef.current.x = dragOffset.x;
    dragStartRef.current.y = dragOffset.y;
  };

  const handlePillDragMove = (dx, dy) =>
    setDragOffset({
      x: clamp(dragStartRef.current.x + dx, DRAG_LIMIT_X),
      y: clamp(dragStartRef.current.y + dy, DRAG_LIMIT_Y),
    });

  const handlePillDragEnd = () => {
    setIsDragging(false);
  };

  // Don't render if user not logged in
  if (!getUserId(user)) return null;

  // Separate visible and minimized chats
  const visibleChats = openChats.filter((c) => !c.minimized);
  const minimizedChats = openChats.filter((c) => c.minimized);

  return (
    <div
      className="fixed bottom-0 right-0 z-50 flex items-end gap-2 p-4 pointer-events-none"
      style={overlayStyle}
    >
      {/* Minimized chat bubbles */}
      {minimizedChats.length > 0 && (
        <div className="flex flex-col gap-2 pointer-events-auto">
          {minimizedChats.map((chat) => (
            <button
              key={getUserId(chat.user)}
              onClick={() => restoreChat(getUserId(chat.user))}
              className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-sm font-bold transition-transform hover:scale-105"
              style={{
                backgroundColor: styles.actionPrimary,
                color: styles.textInverse,
              }}
              title={`Chat with ${chat.user.name}`}
            >
              {chat.user.name?.charAt(0)?.toUpperCase() || "?"}
            </button>
          ))}
        </div>
      )}

      {/* Visible chat windows - stack from right */}
      <div className="flex items-end gap-2 pointer-events-auto">
        {visibleChats.map((chat) => (
          <ChatBubble
            key={getUserId(chat.user)}
            chatUser={chat.user}
            chatId={chat.chatId}
            socketMessages={messages}
            typingUsers={typingUsers}
            onlineUsers={onlineUsers}
            joinChat={joinChat}
            sendMessage={sendMessage}
            setTyping={setTyping}
            startVideoCall={startVideoCall}
            endVideoCall={endVideoCall}
            startAudioCall={startAudioCall}
            endAudioCall={endAudioCall}
          />
        ))}
      </div>

      {/* Contact list bubble - always on the far right */}
      <div className="pointer-events-auto">
        <ContactListBubble
          onlineUsers={onlineUsers}
          isTtv={isTtv}
          onPillDragStart={handlePillDragStart}
          onPillDragMove={handlePillDragMove}
          onPillDragEnd={handlePillDragEnd}
        />
      </div>

      {/* Incoming call modal */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={() => {
            acceptCall({
              chatId: incomingCall.chatId,
              roomId: incomingCall.chatId,
              callerId: incomingCall.callerId,
              type: incomingCall.callType,
            });
            // Store the call info and open CallModal
            setActiveIncomingCall({
              chatId: incomingCall.chatId,
              roomId: incomingCall.chatId,
              callType: incomingCall.callType,
              callerName: incomingCall.name || "Unknown",
            });
            setIncomingCall(null);
          }}
          onReject={() => setIncomingCall(null)}
        />
      )}

      {/* Call Modal for accepted incoming calls */}
      {activeIncomingCall && (
        <CallModal
          isOpen={true}
          callType={activeIncomingCall.callType === "video" ? "video" : "audio"}
          roomId={activeIncomingCall.roomId}
          chatId={activeIncomingCall.chatId}
          userName={user?.name}
          otherUser={{ name: activeIncomingCall.callerName }}
          onClose={() => setActiveIncomingCall(null)}
          endVideoCall={endVideoCall}
          endAudioCall={endAudioCall}
        />
      )}
    </div>
  );
}
