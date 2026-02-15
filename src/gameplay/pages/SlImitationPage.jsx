import { useEffect, useMemo, useRef, useState } from "react";
import Camera from "../../io/camera/Camera";
import { createLandmarkRecorder, getReferenceClip, initHandLandmarker, scoreMotion } from "../../cv";
import { useLessonGame } from "../../hooks/useLesson";

const CAPTURE_FPS = 12;
const COUNTDOWN_SECONDS = 3;

const SlImitationPage = () => {
  const { currentLevel, currentVideo, handleCheckEvaluation } = useLessonGame();

  const [referenceClip, setReferenceClip] = useState(null);
  const [status, setStatus] = useState("idle");
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(null);

  const recorderRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const recordTimerRef = useRef(null);

  const trackingTarget = currentLevel?.trackingTarget || "hands";
  const successThreshold =
    typeof currentLevel?.successThreshold === "number"
      ? currentLevel.successThreshold
      : 0.7;

  const videoSrc = currentLevel?.referenceVideoId?.link || currentVideo?.link || "";
  const videoId = currentLevel?.referenceVideoId?._id || currentVideo?._id || "";

  const cleanupTimers = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (recordTimerRef.current) {
      clearTimeout(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  useEffect(() => {
    recorderRef.current = createLandmarkRecorder({ fps: CAPTURE_FPS, target: trackingTarget });
    return () => {
      cleanupTimers();
      recorderRef.current = null;
    };
  }, [trackingTarget, currentLevel?._id]);

  useEffect(() => {
    let cancelled = false;
    cleanupTimers();
    setResult(null);
    setReferenceClip(null);
    setProgress(null);

    if (!videoSrc) {
      setStatus("error");
      setError("Reference video missing.");
      return () => {};
    }

    setStatus("loading-ref");
    setError(null);

    // Initialize MediaPipe first, then load reference clip
    initHandLandmarker()
      .then(() => {
        if (cancelled) return;
        return getReferenceClip({
          videoId,
          src: videoSrc,
          target: trackingTarget,
          fps: CAPTURE_FPS,
          onProgress: (info) => {
            if (!cancelled) setProgress(info);
          },
        });
      })
      .then((clip) => {
        if (cancelled || !clip) return;
        setReferenceClip(clip);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setError(err?.message || "Failed to analyze reference video.");
      });

    return () => {
      cancelled = true;
    };
  }, [videoSrc, videoId, trackingTarget]);

  const beginRecording = () => {
    if (!referenceClip) return;
    recorderRef.current?.start();
    setStatus("recording");

    const durationMs = Math.max(1000, Math.round(referenceClip.durationMs || 0));
    recordTimerRef.current = setTimeout(async () => {
      const userClip = recorderRef.current?.stop();
      setStatus("scoring");

      const evaluation = scoreMotion(referenceClip, userClip, {
        successThreshold,
        allowMirror: false,
      });
      setResult(evaluation);
      await handleCheckEvaluation(evaluation);
      setStatus("done");
    }, durationMs);
  };

  const startAttempt = () => {
    if (!referenceClip || status === "recording") return;
    setResult(null);
    setError(null);
    setCountdown(COUNTDOWN_SECONDS);
    setStatus("countdown");

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          cleanupTimers();
          beginRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const overlay = countdown > 0 && (
    <div className="flex items-center justify-center h-full">
      <div className="text-4xl font-bold text-white drop-shadow">{countdown}</div>
    </div>
  );

  const statusLabel = useMemo(() => {
    switch (status) {
      case "loading-ref":
        return progress ? "Analyzing demo…" : "Loading hand tracker…";
      case "ready":
        return "Ready to imitate.";
      case "countdown":
        return "Get ready…";
      case "recording":
        return "Recording…";
      case "scoring":
        return "Scoring…";
      case "done":
        return result?.pass ? "Nice!" : "Try again";
      case "error":
        return "Setup issue";
      default:
        return "";
    }
  }, [status, result, progress]);

  return (
    <div className="p-4 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">Demo</h2>
          {videoSrc ? (
            <video
              src={videoSrc}
              controls
              className="w-full rounded-lg border border-gray-200"
            />
          ) : (
            <div className="text-sm text-gray-500">No reference video.</div>
          )}
          {progress && status === "loading-ref" && (
            <div className="text-xs text-gray-500 mt-2">
              Frames {progress.current}/{progress.total}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-2">Your Camera</h2>
          <Camera
            width={480}
            height={360}
            fps={30}
            onFrame={(frame) => recorderRef.current?.onFrame(frame)}
            overlay={overlay}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-sm text-gray-600">{statusLabel}</div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {result && (
          <div className="text-sm text-gray-700">
            Score: {(result.score * 100).toFixed(0)}% • Threshold: {Math.round(successThreshold * 100)}%
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={startAttempt}
          disabled={status === "loading-ref" || status === "recording" || status === "scoring"}
          className="px-4 py-2 rounded bg-[#155e75] text-white disabled:bg-gray-300"
        >
          {status === "recording" || status === "scoring" ? "Working…" : "Start"}
        </button>
        {status === "done" && (
          <button
            onClick={startAttempt}
            className="px-4 py-2 rounded border border-gray-300"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default SlImitationPage;
