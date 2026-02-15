// src/social/messages/overlay/CallModal.jsx
import { useEffect, useRef, useContext, useMemo } from "react";
import { FiPhoneOff } from "react-icons/fi";
import { ThemeContext } from "../../../utils/themes/ThemeContext";

export default function CallModal({
  isOpen,
  callType, // "audio" | "video"
  roomId,
  chatId,
  userName,
  otherUser,
  onClose,
  endVideoCall,
  endAudioCall,
}) {
  const containerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const callEndedRef = useRef(false);

  const { currentTheme, theme } = useContext(ThemeContext) || {};

  const styles = useMemo(() => {
    const t = theme || {};
    const legacy = currentTheme || {};

    return {
      actionPrimary: t?.action?.primary ?? legacy?.buttonColor ?? "#2563eb",
      textInverse: t?.text?.inverse ?? "#ffffff",
      textPrimary: t?.text?.primary ?? "#111827",
      panelBg: t?.surface?.container ?? legacy?.containerColor ?? "#ffffff",
    };
  }, [theme, currentTheme]);

  useEffect(() => {
    if (!isOpen || !roomId || jitsiApiRef.current) return;

    callEndedRef.current = false;

    const domain = "8x8.vc";
    const options = {
      roomName: `${import.meta.env.VITE_JITSI_APP_ID}/${roomId}`,
      parentNode: containerRef.current,
      userInfo: { displayName: userName },
      width: "100%",
      height: "100%",
      configOverwrite:
        callType === "audio"
          ? {
              startWithVideoMuted: true,
              startWithAudioMuted: false,
              disableVideoBackground: true,
              prejoinPageEnabled: false,
            }
          : {
              prejoinPageEnabled: false,
            },
      interfaceConfigOverwrite:
        callType === "audio"
          ? {
              TOOLBAR_BUTTONS: ["microphone", "hangup", "chat", "participants-pane"],
              VIDEO_LAYOUT_FIT: "nocrop",
              SHOW_JITSI_WATERMARK: false,
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            }
          : {
              SHOW_JITSI_WATERMARK: false,
            },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
    jitsiApiRef.current = api;

    api.addEventListener("videoConferenceJoined", () => {
      callStartTimeRef.current = Date.now();
    });

    const handleCallEnd = () => {
      if (callEndedRef.current) return;
      callEndedRef.current = true;

      const endTime = Date.now();
      const durationMinutes = callStartTimeRef.current
        ? Number(((endTime - callStartTimeRef.current) / (1000 * 60)).toFixed(2))
        : 0;

      if (callType === "video") {
        endVideoCall?.({ chatId, duration: durationMinutes, roomId });
      } else {
        endAudioCall?.({ chatId, duration: durationMinutes, roomId });
      }

      onClose();
    };

    api.addEventListener("videoConferenceLeft", handleCallEnd);
    api.addEventListener("readyToClose", handleCallEnd);

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [isOpen, roomId, callType, userName, chatId]);

  const handleEndCall = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("hangup");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
      <div
        className="relative w-full max-w-2xl h-[80vh] rounded-xl overflow-hidden shadow-2xl flex flex-col"
        style={{ backgroundColor: styles.panelBg }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
          <div className="flex items-center gap-3">
            {callType === "audio" && otherUser && (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: styles.actionPrimary }}
              >
                {otherUser.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <p className="font-semibold">
                {callType === "video" ? "Video Call" : "Audio Call"}
              </p>
              <p className="text-sm text-gray-300">
                {otherUser?.name || "Unknown"}
              </p>
            </div>
          </div>

          <button
            onClick={handleEndCall}
            className="p-2 rounded-full bg-red-600 hover:bg-red-700 transition"
            title="End call"
          >
            <FiPhoneOff size={20} />
          </button>
        </div>

        {/* Call container */}
        <div className="flex-1 bg-gray-800 relative">
          {callType === "audio" && otherUser && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold mb-4"
                style={{ backgroundColor: styles.actionPrimary, color: styles.textInverse }}
              >
                {otherUser.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <p className="text-white text-xl font-semibold">{otherUser.name}</p>
              <p className="text-gray-400 text-sm mt-1">Audio call in progress...</p>
            </div>
          )}
          <div ref={containerRef} className="w-full h-full relative z-10" />
        </div>
      </div>
    </div>
  );
}
