// src/social/messages/overlay/ChatOverlayContext.jsx
import { createContext, useContext, useState, useCallback } from "react";

const ChatOverlayContext = createContext(null);

const getUserId = (user) => user?._id || user?.id || "";


export function ChatOverlayProvider({ children }) {
  // Array of open chats: [{ user, chatId, minimized }]
  const [openChats, setOpenChats] = useState([]);
  const [contactListOpen, setContactListOpen] = useState(false);

  const MAX_VISIBLE_CHATS = 3; // Max chats visible at once

  const openChat = useCallback((user, chatId) => {
    setOpenChats((prev) => {
      // If already open, bring to front (move to end of array)
      const existing = prev.find((c) => getUserId(c.user) === getUserId(user));
      if (existing) {
        const filtered = prev.filter((c) => getUserId(c.user) !== getUserId(user));
        return [...filtered, { ...existing, minimized: false }];
      }

      // Add new chat
      const newChat = { user, chatId, minimized: false };
      const updated = [...prev, newChat];

      // If we exceed max, minimize the oldest
      if (updated.filter((c) => !c.minimized).length > MAX_VISIBLE_CHATS) {
        const firstNonMinimized = updated.findIndex((c) => !c.minimized);
        if (firstNonMinimized >= 0) {
          updated[firstNonMinimized].minimized = true;
        }
      }

      return updated;
    });
  }, []);

  const closeChat = useCallback((userId) => {
    setOpenChats((prev) => prev.filter((c) => getUserId(c.user) !== userId));
  }, []);

  const minimizeChat = useCallback((userId) => {
    setOpenChats((prev) =>
      prev.map((c) =>
        getUserId(c.user) === userId ? { ...c, minimized: true } : c
      )
    );
  }, []);

  const restoreChat = useCallback((userId) => {
    setOpenChats((prev) => {
      const updated = prev.map((c) =>
        getUserId(c.user) === userId ? { ...c, minimized: false } : c
      );

      // If restoring causes overflow, minimize oldest visible
      const visibleCount = updated.filter((c) => !c.minimized).length;
      if (visibleCount > MAX_VISIBLE_CHATS) {
        const firstVisible = updated.findIndex(
          (c) => !c.minimized && getUserId(c.user) !== userId
        );
        if (firstVisible >= 0) {
          updated[firstVisible].minimized = true;
        }
      }

      return updated;
    });
  }, []);

  const updateChatId = useCallback((userId, chatId) => {
    setOpenChats((prev) =>
      prev.map((c) =>
        getUserId(c.user) === userId ? { ...c, chatId } : c
      )
    );
  }, []);

  const toggleContactList = useCallback(() => {
    setContactListOpen((prev) => !prev);
  }, []);

  const closeContactList = useCallback(() => {
    setContactListOpen(false);
  }, []);

  return (
    <ChatOverlayContext.Provider
      value={{
        openChats,
        openChat,
        closeChat,
        minimizeChat,
        restoreChat,
        updateChatId,
        contactListOpen,
        toggleContactList,
        closeContactList,
      }}
    >
      {children}
    </ChatOverlayContext.Provider>
  );
}

export function useChatOverlay() {
  const ctx = useContext(ChatOverlayContext);
  if (!ctx) {
    throw new Error("useChatOverlay must be used within ChatOverlayProvider");
  }
  return ctx;
}
