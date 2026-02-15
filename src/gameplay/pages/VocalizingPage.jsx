import { useEffect, useRef, useState } from "react";
import { ReactMediaRecorder } from "react-media-recorder";
import axios from "axios";
import GraphemeTextOverlay from "../../components/GraphemeTextOverlay";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import { useCredits } from "../../hooks/useCredits";
import { useLessonGame } from "../../hooks/useLesson";

const API_URL = import.meta.env.VITE_API_URL;

/* 3-D fox ----------------------------------------------------------- */
// function FoxModel(props) {
//     const { scene } = useGLTF("/fox_glb.glb");
//     <primitive object={scene} scale={1} {...props} />
//  }
//  useGLTF.preload("/fox_glb.glb");


/* helper: blob → base64 ------------------------------------------------ */
// To be clear, below, res = resoution and rej = reject
const blobToB64 = (b) =>
  new Promise((res, rej) => {
    //FileReader is a built in Web API class
    const r = new FileReader();
    r.onloadend = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(b);
  });

/* --------------------------------------------------------------------- */
export default function VocalizingPage() {
  /* context ----------------------------------------------------------- */
  const {
    currentLevel,
    currentQuestion,
    handleCheckAnswer,
  } = useLessonGame();

  /* credits ----------------------------------------------------------- */
  const { credits, deductCredits } = useCredits();
  const SPEAKING_COST = 20;

  /* ui state ---------------------------------------------------------- */
  const [statusMsg, setStatusMsg] = useState("");
  const [transcript, setTranscript] = useState("");

  /* recorder refs (so global key handler is always in sync) ----------- */
  const statusRef           = useRef("idle");
  const startRecRef         = useRef(null);
  const stopRecRef          = useRef(null);
  const clearBlobUrlRef     = useRef(null);
  const mediaBlobRef        = useRef(null);
  const mediaBlobUrlRef     = useRef(null);

  /* audio element for local playback --------------------------------- */
  const audioRef = useRef(null);
  const creditsRef = useRef(credits);

  useEffect(() => {
    creditsRef.current = credits;
  }, [credits]);

  /* reset text when a new vocalizing level loads ----------------------- */
  useEffect(() => {
    if (currentLevel?.type === "vocalizing") {
      setStatusMsg("");
      setTranscript("");
    }
  }, [currentLevel]);

  /* global key-binding once ------------------------------------------ */
  useEffect(() => {
    const handler = async (e) => {
      // ignore if typing
      if (
        /INPUT|TEXTAREA/.test(e.target.tagName) ||
        e.target.isContentEditable
      )
        return;

      /* SPACE -------------------------------------------------------- */
      if (e.code === "Space") {
        e.preventDefault();

        /* priority 2: recorder logic */
        if (statusRef.current === "recording") {
          stopRecRef.current?.();
        } else if (mediaBlobUrlRef.current) {
          // submit current take
          const blob =
            mediaBlobRef.current ||
            (await fetch(mediaBlobUrlRef.current).then((r) => r.blob()));
          blob && sendAudio(blob);
        } else {
          clearBlobUrlRef.current?.();
          startRecRef.current?.();
          setStatusMsg("");
          setTranscript("");
        }
      }

      /* P = play last take ------------------------------------------ */
      if (e.key === "p" || e.key === "P") {
        audioRef.current?.play();
      }

      // 🗑️ 'd' = delete recording
      // e.key... key looks like a method built into the argument
      // typically called e, which means event.
      // This is classic onKeyDown behaviour
if (e.key === "d" || e.key === "D") {
  if (mediaBlobUrlRef.current || mediaBlobRef.current) {
    clearBlobUrlRef.current?.();
    setStatusMsg("🎧 Recording deleted.");
    setTranscript("");
  }
}


      /* R = re-record ----------------------------------------------- */
      if (e.key === "r" || e.key === "R") {
        clearBlobUrlRef.current?.();
        startRecRef.current?.();
        setStatusMsg("");
        setTranscript("");
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // deps: none

  /* upload + verify -------------------------------------------------- */
/* upload + verify -------------------------------------------------- */

// the sendAudio function is an async function with blob as the argument.
const fetchCreditBalance = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_URL}/credits/balance`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data?.success && typeof res.data?.credits === "number") {
      return res.data.credits;
    }
  } catch (err) {
    console.warn("Failed to fetch credit balance:", err?.message || err);
  }
  return null;
};

const sendAudio = async (blob) => {
  if (!blob) return alert("Please record something first.");
  if (!currentLevel?._id) return setStatusMsg("⚠️ Cannot find level ID.");

  // Check if user has enough credits
  const latestCredits = await fetchCreditBalance();
  const availableCredits =
    typeof latestCredits === "number"
      ? latestCredits
      : typeof creditsRef.current === "number"
      ? creditsRef.current
      : credits;

  if (availableCredits < SPEAKING_COST) {
    setStatusMsg(`⚠️ Not enough credits. Need ${SPEAKING_COST} credits.`);
    return;
  }

  try {
    setStatusMsg("⏳ Uploading…");
    const audioContent = await blobToB64(blob);
    const lang = localStorage.getItem("gameLanguage") || "en";

    const { data } = await axios.post(
      `${API_URL}/levels/${currentLevel._id}/verify-speech?lang=${lang}`,
      {
        audioContent,
        mimeType: blob.type || mimeType, // 🔑 pass MIME info
      }
    );

    setTranscript(data.transcript || "");
    if (data.success) {
      // Deduct credits on successful vocalizing level
      const deductResult = await deductCredits(SPEAKING_COST);
      if (!deductResult.success) {
        console.warn("Failed to deduct credits:", deductResult.error);
      }
      setStatusMsg("✅ Correct! Moving on…");
      handleCheckAnswer(data.target);
    } else {
      setStatusMsg("❌ Not quite, try again.");
    }
  } catch (err) {
    console.error("verifySpeech error", err);
    setStatusMsg("⚠️ Server error.");
  }
};


  function pickMime() {
  const candidates = [
    'audio/mp4;codecs=mp4a.40.2', // AAC in MP4
    'audio/mp4',                  // plain MP4 (AAC implied)
    'audio/x-m4a',                // some Safari builds report this
    'audio/webm;codecs=opus',     // Chrome/Firefox
    'audio/webm',
    'audio/wav'                   // last-resort (big files)
  ];
  return candidates.find(t => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) || '';
}
const mimeType = pickMime();
console.log("🔥 Rendering SpeakingPage. mimeType:", mimeType);



console.log("Rendering SpeakingPage, mimeType:", mimeType);

  /* ------------------------------------------------------------------ */
  return (
        <>
      {/* 3-D fox in the top-right corner */}
      {/* <Canvas
        style={{ position: "fixed", top: 0, right: 0, width: 220, height: 220 }}
        camera={{ position: [0, 0, 2.5] }}
      >
        <ambientLight intensity={1} />
        <FoxModel />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas> */}
    <div className="flex flex-col items-center gap-3 py-4 w-full max-w-screen-md mx-auto">
      <GraphemeTextOverlay
        className="my-1"
        sentence={
          currentQuestion ||
          "Something went wrong. Please consider donating so we can fix it."
        }
      />

<ReactMediaRecorder
  audio
mediaRecorderOptions={{ mimeType }}         // ← this is the important one
  blobPropertyBag={{ type: mimeType }}
        render={({
          status,
          startRecording,
          stopRecording,
          mediaBlobUrl,
          clearBlobUrl,
          mediaBlob,
        }) => {
          /* keep refs fresh each render ---------------------------- */
          statusRef.current       = status;
          startRecRef.current     = startRecording;
          stopRecRef.current      = stopRecording;
          clearBlobUrlRef.current = clearBlobUrl;
          mediaBlobRef.current    = mediaBlob;
          mediaBlobUrlRef.current = mediaBlobUrl;
          console.log('[rec]', { status, chosenMime: mimeType, blobType: mediaBlob?.type, url: mediaBlobUrl });

          console.log("status", status, "blob type", mediaBlob?.type, "url", mediaBlobUrl);


          return (
            <>
              {/* controls ------------------------------------------- */}
              <div className="flex items-center gap-3 mt-2">
                {/* record / pause */}
                <button
                  onClick={() => {
                    if (status === "recording") {
                      stopRecording();
                    } else {
                      clearBlobUrl();
                      startRecording();
                      setStatusMsg("");
                      setTranscript("");
                    }
                  }}
                  className={`w-16 h-16 rounded-full text-3xl flex items-center justify-center transition-colors relative
                    ${status === "recording" ? "bg-red-500" : "bg-green-600"}
                    text-white hover:brightness-110
                    ${status === "recording" ? "animate-pulse" : ""}`}
                >
                  {status === "recording" ? "⏸️" : "▶️"}
                </button>

                {/* submit */}
                <button
                  onClick={async () => {
                    // Notice how there is en entire function within this onClick
                    const blobReady =
                      mediaBlob ||
                      (mediaBlobUrl
                        ? await fetch(mediaBlobUrl).then((r) => r.blob())
                        : null);
                    blobReady ? sendAudio(blobReady) : alert("Record first.");
                  }}
                  disabled={status !== "stopped" && !mediaBlobUrl}
                  className={`px-4 py-2 rounded text-white text-sm font-semibold ${
                    status === "stopped" || mediaBlobUrl
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  Submit
                </button>
              </div>

              {/* preview player ------------------------------------ */}
              {mediaBlobUrl && (
                <audio
                  ref={audioRef}
                  //controls is separate to src. These are all methods native
                  // to audio API in HTML5)
                  // controls just adds default controller.
                  controls
                  src={mediaBlobUrl}
                  className="mt-2 w-full max-w-xs"
                />
              )}

              {/* feedback ------------------------------------------ */}
              
              {/* when you see the name of a variable like statusMsg,
              which was declared as react state, and then &&, this is called
              a shorthand conditional render. That means that
              it only renders the part in brackets after the &&
              if the variable before the && is truthy.
              */}
              {statusMsg && (
                <p className="mt-1 text-sm font-medium">{statusMsg}</p>
              )}
              {transcript && (
                <p className="text-lg text-gray-500">
                  Google heard: “{transcript}”
                </p>
              )}
            </>
          );
        }}
      />
    </div>
    </>
  );
}
