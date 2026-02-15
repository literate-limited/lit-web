import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function useChatSocket({ token, baseUrl, userId }) {
    const socketRef = useRef(null);
    const joinedChatsRef = useRef(new Set());

    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState({});
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [incomingCall, setIncomingCall] = useState(null);

    useEffect(() => {
        if (!token || !baseUrl) return;

        // Create socket connection
        const socket = io(baseUrl, {
            auth: { token },
            autoConnect: true,
            path: "/socket.io",
        });

        socket.on("connect_error", (err) => {
            console.warn("Socket connection error", err?.message);
        });

        socketRef.current = socket;

        // Connect event
        socket.on("connect", () => {
            setConnected(true);
            console.log("Socket connected →", socket.id);
            joinedChatsRef.current.forEach((chatId) => {
                socket.emit("join_chat", { chatId });
            });
        });
        socketRef.current.on("incoming_call", (data) => {
            if (data.status === "rejected") {
                alert(data.message || "Call rejected by the user");
                setIncomingCall(null);
                return;
            }
            if ("Notification" in window && Notification.permission === "granted") {
                const notification = new Notification("Incoming Call", {
                    body: `${data.name} is calling you`,
                    icon: "/call.png",
                    tag: "incoming-call", // prevents duplicate notifications
                });

                notification.onclick = () => {
                    window.focus(); // bring tab to front

                    // redirect to messages page
                    window.location.href = `${import.meta.env.VITE_APP_URL}/messages`;

                    notification.close();
                };
            }
            setTimeout(() => {
                setIncomingCall(data);
            }, 3000); // delay to allow notification to show first
        });

        // Disconnect event
        socket.on("disconnect", () => {
            setConnected(false);
        });
        socket.on("call_event", (callMsg) => {
            setMessages((prev) => [
                ...prev,
                {
                    _id: `${callMsg.type}-${callMsg.chatId}-${Date.now()}`,
                    chatId: callMsg.chatId,
                    senderId: callMsg.senderId,
                    type: callMsg.type,
                    callMeta: {
                        roomId: callMsg.roomId,
                        duration: callMsg.duration,
                    },
                    createdAt: callMsg.createdAt || new Date(),
                },
            ]);
        });

        // Receive new message
        socket.on("new_message", (msg) => {
            setMessages((prev) => {
                const exists = prev.some((m) => m._id === msg._id);
                if (exists) return prev;

                // Replace pending message from same sender + content
                const pendingIndex = prev.findIndex(
                    (m) =>
                        m.__pending &&
                        m.chatId === msg.chatId &&
                        m.senderId === msg.senderId &&
                        m.content === msg.content
                );
                if (pendingIndex !== -1) {
                    const next = [...prev];
                    next[pendingIndex] = msg;
                    return next;
                }

                return [...prev, msg];
            });
        });

        // Handle typing event
        socket.on("typing", ({ chatId, userId, isTyping }) => {
            console.log("Typing event", { chatId, userId, isTyping });
            setTypingUsers((prev) => {
                const copy = { ...prev };

                let list = copy[chatId] || [];

                if (isTyping) {
                    // Add user
                    if (!list.includes(userId)) list.push(userId);
                } else {
                    // Remove user
                    list = list.filter((id) => id !== userId);
                }

                copy[chatId] = list;
                return copy;
            });
        });
        socket.on("user_online", ({ userId }) => {
            setOnlineUsers((prev) => new Set(prev).add(userId));
        });

        socket.on("user_offline", ({ userId }) => {
            setOnlineUsers((prev) => {
                const copy = new Set(prev);
                copy.delete(userId);
                return copy;
            });
        });

        socket.on("online_users", ({ userIds }) => {
            setOnlineUsers(new Set(userIds)); // replace entire set
        });

        // Cleanup
        return () => {
            socket.disconnect();
        };
    }, [token, baseUrl]);

    // Join chat room
    const joinChat = (chatId) => {
        if (!chatId) return;
        joinedChatsRef.current.add(chatId);
        socketRef.current?.emit("join_chat", { chatId });
    };

    // Send a message
    const sendMessage = (payload) => {
        const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        if (payload?.chatId && payload?.content && userId) {
            setMessages((prev) => [
                ...prev,
                {
                    _id: tempId,
                    chatId: payload.chatId,
                    senderId: userId,
                    content: payload.content,
                    createdAt: new Date().toISOString(),
                    __pending: true,
                },
            ]);
        }

        return new Promise((resolve) => {
            socketRef.current?.emit("send_message", payload, (ack) => {
                if (ack?.status === "ok" && ack?.data) {
                    setMessages((prev) => {
                        const existing = prev.some((m) => m._id === ack.data._id);
                        if (existing) return prev;
                        const pendingIndex = prev.findIndex((m) => m._id === tempId);
                        if (pendingIndex === -1) return [...prev, ack.data];
                        const next = [...prev];
                        next[pendingIndex] = ack.data;
                        return next;
                    });
                } else if (ack?.status === "error") {
                    setMessages((prev) => prev.filter((m) => m._id !== tempId));
                }
                resolve(ack);
            });
        });
    };

    const acceptCall = ({ chatId, roomId, callerId, type }) => {
        socketRef.current?.emit(
            "call_accepted",
            { chatId, roomId, callerId, type },
            (res) => {
                if (res?.status !== "ok") {
                    alert(res?.message || "Failed to accept call");
                }
                else {
                    setIncomingCall(null);
                }
            }
        );
    };

    // Set typing
    const setTyping = ({ chatId, isTyping }) => {
        socketRef.current?.emit("typing", { chatId, isTyping });
    };
    const startVideoCall = ({ chatId, roomId, receiverId }) => {
        socketRef.current?.emit("video_call_started", { chatId, roomId, receiverId }, (res) => {
            if (res.status !== "ok") {
                alert(res.message);
            }
        });
    };

    const endVideoCall = ({ chatId, roomId, duration }) => {
        socketRef.current?.emit("video_call_ended", {
            chatId,
            roomId,
            duration,
        });
    };

    const startAudioCall = ({ chatId, roomId, receiverId }) => {
        socketRef.current?.emit("audio_call_started", { chatId, roomId, receiverId }, (res) => {
            if (res.status !== "ok") {
                alert(res.message);
            }
        });
    };

    const endAudioCall = ({ chatId, roomId, duration }) => {
        socketRef.current?.emit("audio_call_ended", {
            chatId,
            roomId,
            duration,
        });
    };

    return {
        socket: socketRef.current,
        connected,
        onlineUsers,
        messages,
        typingUsers,
        joinChat,
        sendMessage,
        setTyping,
        startVideoCall,
        endVideoCall,
        startAudioCall,
        endAudioCall,
        setMessages, // expose setter to load history
        incomingCall,
        setIncomingCall,
        acceptCall
    };
}
