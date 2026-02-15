import { useEffect, useRef } from "react";

// eslint-disable-next-line react/prop-types
const VideoCall = ({ roomId, userName, setVideoCall, endVideoCall, chatId }) => {
  const containerRef = useRef(null);
  const jitsiLoadedRef = useRef(false);
  const callStartTimeRef = useRef(null);
  const callEndedRef = useRef(false);

  useEffect(() => {
    if (jitsiLoadedRef.current) return;
    jitsiLoadedRef.current = true;

    (async () => {
      // const token = await fetchJitsiToken(userName, roomId);

      const domain = "8x8.vc";
      const options = {
        roomName: `${import.meta.env.VITE_JITSI_APP_ID}/${roomId}`,
        parentNode: containerRef.current,
        // jwt: token,
        userInfo: { displayName: userName },
      };

      const api = new window.JitsiMeetExternalAPI(domain, options);
      api.addEventListener("videoConferenceJoined", () => {
        callStartTimeRef.current = Date.now();
        console.log("Call started at:", callStartTimeRef.current);
      });
      api.addEventListener("participantLeft", (event) => {
        console.log("Participant left:", event);
      });
      const handleCallEnd = () => {
        if (callEndedRef.current) return; 
        callEndedRef.current = true;
        const endTime = Date.now();
        const durationMinutes = callStartTimeRef.current
          ? Number(((endTime - callStartTimeRef.current) / (1000 * 60)).toFixed(2))
          : 0;

        endVideoCall({ chatId, duration: durationMinutes, roomId });
        setVideoCall(false);
      };

      api.addEventListener("videoConferenceLeft", handleCallEnd);
      api.addEventListener("readyToClose", handleCallEnd);
    })();

  }, []);

  return <div ref={containerRef} style={{ height: "90vh" }} />;
};

export default VideoCall;