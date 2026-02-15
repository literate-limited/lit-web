import { useEffect, useRef, useState } from "react";
import { ReactMediaRecorder } from "react-media-recorder";
import axios from "axios";
import DisplayText from "../components/DisplayText";
import { useLessonGame } from "../../hooks/useLesson";

const API_URL = import.meta.env.VITE_API_URL;

const blobToB64 = (b) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(b);
  });

function pickMime() {
  const candidates = [
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
    "audio/x-m4a",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/wav",
  ];
  return (
    candidates.find(
      (t) =>
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(t)
    ) || ""
  );
}

export default function SpeakingPage() {
  const { currentLevel, currentQuestion, handleCheckAnswer } =
    useLessonGame();

  const [statusMsg, setStatusMsg] = useState("");
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (currentLevel?.type === "speaking") {
      setStatusMsg("");
      setTranscript("");
      setScore(null);
      setFeedback("");
    }
  }, [currentLevel]);

  const sendAudio = async (blob) => {
    if (!blob) return alert("Please record something first.");
    if (!currentLevel?._id) return setStatusMsg("⚠️ Cannot find level ID.");

    try {
      setLoading(true);
      setStatusMsg("⏳ Uploading…");
      const audioContent = await blobToB64(blob);
      const lang = localStorage.getItem("gameLanguage") || "en";

      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${API_URL}/levels/${currentLevel._id}/grade-speaking?lang=${lang}`,
        {
          audioContent,
          mimeType: blob.type || pickMime(),
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      setTranscript(data.transcript || "");
      setScore(typeof data.score === "number" ? data.score : null);
      setFeedback(data.feedback || "");
      setStatusMsg("✅ Graded. Review your score.");
    } catch (err) {
      console.error("gradeSpeaking error", err);
      setStatusMsg("⚠️ Server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    handleCheckAnswer(transcript || currentQuestion || "");
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4 w-full max-w-screen-md mx-auto">
      <DisplayText />
      <p className="text-sm text-slate-600 text-center max-w-xl">
        Record your spoken response to the topic. We will transcribe and grade
        it out of 20.
      </p>
      {statusMsg && (
        <p className="text-sm text-slate-600 text-center">{statusMsg}</p>
      )}

      <ReactMediaRecorder
        audio
        render={({
          status,
          startRecording,
          stopRecording,
          mediaBlobUrl,
          clearBlobUrl,
          mediaBlob,
        }) => (
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="text-sm text-gray-500">Recorder: {status}</p>

            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={startRecording}
                className="bg-red-500 px-4 py-2 rounded text-white"
              >
                🎙️ Record
              </button>
              <button
                onClick={stopRecording}
                className="bg-gray-700 px-4 py-2 rounded text-white"
              >
                ⏹ Stop
              </button>
              {mediaBlobUrl && (
                <button
                  onClick={() => sendAudio(mediaBlob)}
                  className="bg-blue-600 px-4 py-2 rounded text-white"
                  disabled={loading}
                >
                  {loading ? "Grading..." : "Send for grading"}
                </button>
              )}
              {mediaBlobUrl && (
                <button
                  onClick={() => {
                    clearBlobUrl();
                    setTranscript("");
                    setScore(null);
                    setFeedback("");
                  }}
                  className="border border-slate-300 px-4 py-2 rounded text-slate-700"
                >
                  Reset
                </button>
              )}
            </div>

            {mediaBlobUrl && (
              <audio
                ref={audioRef}
                src={mediaBlobUrl}
                controls
                className="mt-3"
              />
            )}
          </div>
        )}
      />

      {transcript && (
        <div className="p-3 border rounded bg-gray-100 w-full">
          <strong>Transcript:</strong>
          <p className="mt-2 text-sm text-slate-700">{transcript}</p>
        </div>
      )}

      {score !== null && (
        <div className="p-3 border rounded bg-white w-full space-y-2">
          <p className="text-sm font-semibold">Score: {score} / 20</p>
          {feedback && <p className="text-sm text-slate-600">{feedback}</p>}
          <div className="flex justify-end">
            <button
              onClick={handleContinue}
              className="bg-emerald-600 px-4 py-2 rounded text-white"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
