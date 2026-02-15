import { useEffect, useRef } from "react";
//commebnt
// eslint-disable-next-line react/prop-types
const AudioCall = ({ roomId, userName, setAudioCall, chatId, endAudioCall }) => {
  const containerRef = useRef(null);
  const jitsiLoadedRef = useRef(false);
  const callStartTimeRef = useRef(null);
  const callEndedRef = useRef(false);

  useEffect(() => {
    if (jitsiLoadedRef.current) return;
    jitsiLoadedRef.current = true;

    const domain = "8x8.vc";

    const options = {
      roomName: `${import.meta.env.VITE_JITSI_APP_ID}/${roomId}`,
      parentNode: containerRef.current,

      userInfo: {
        displayName: userName,
      },

      /** 🔥 Disable video completely */
      configOverwrite: {
        startWithVideoMuted: true,
        startWithAudioMuted: false,
        disableVideoBackground: true,
        prejoinPageEnabled: false,
      },

      /** 🔥 Hide video UI buttons */
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          "microphone",
          "hangup",
          "chat",
          "participants-pane",
        ],
        VIDEO_LAYOUT_FIT: "nocrop",
        SHOW_JITSI_WATERMARK: false,

        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,

      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
 api.addEventListener("videoConferenceJoined", () => {
        callStartTimeRef.current = Date.now();
        console.log("Call started at:", callStartTimeRef.current);
      });
   const handleCallEnd = () => {
        if (callEndedRef.current) return; 
        callEndedRef.current = true;
        const endTime = Date.now();
        const durationMinutes = callStartTimeRef.current
          ? Number(((endTime - callStartTimeRef.current) / (1000 * 60)).toFixed(2))
          : 0;

        endAudioCall({ chatId, duration: durationMinutes, roomId });
        setAudioCall(false);
      };

      api.addEventListener("videoConferenceLeft", handleCallEnd);
      api.addEventListener("readyToClose", handleCallEnd);
    return () => api.dispose();
  }, []);

  return <div ref={containerRef} style={{ height: "90vh" }} />;
};

export default AudioCall;

// test