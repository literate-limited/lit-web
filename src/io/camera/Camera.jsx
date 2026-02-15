import { useEffect, useRef, useState, useCallback } from "react";

export default function Camera({
  mode = "stream",
  facing = "user",
  fps = 30,
  width = 640,
  height = 480,
  onFrame,
  onClip,
  onError,
  overlay,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const frameIndexRef = useRef(0);
  const rafRef = useRef(null);

  const [ready, setReady] = useState(false);

  // ---- Init camera
  useEffect(() => {
    let cancelled = false;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width,
            height,
            frameRate: fps,
          },
          audio: false,
        });

        if (cancelled) return;

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setReady(true);
      } catch (err) {
        onError && onError(err);
      }
    }

    initCamera();

    return () => {
      cancelled = true;
      stop();
    };
  }, [facing, fps, width, height]);

  // ---- Frame loop (stream mode)
  const frameLoop = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !onFrame) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(video, 0, 0, width, height);

    const bitmap = await createImageBitmap(canvas);

    onFrame({
      imageBitmap: bitmap,
      timestamp: performance.now(),
      frameIndex: frameIndexRef.current++,
    });

    rafRef.current = requestAnimationFrame(frameLoop);
  }, [onFrame, width, height]);

  useEffect(() => {
    if (ready && mode === "stream" && onFrame) {
      rafRef.current = requestAnimationFrame(frameLoop);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, mode, onFrame, frameLoop]);

  // ---- Recording
  const startRecording = () => {
    if (!streamRef.current) return;

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm",
    });

    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      onClip && onClip(blob);
    };

    recorder.start();
    recorderRef.current = recorder;
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  };

  // ---- Cleanup
  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    streamRef.current = null;
    recorderRef.current = null;
    setReady(false);
  };

  return (
    <div style={{ position: "relative", width, height }}>
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          width,
          height,
          objectFit: "cover",
          transform: facing === "user" ? "scaleX(-1)" : undefined,
        }}
      />

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {overlay != null ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        >
          {overlay}
        </div>
      ) : null}

      {mode === "record" ? (
        <div style={{ position: "absolute", bottom: 8, left: 8 }}>
          <button onClick={startRecording}>Start</button>
          <button onClick={stopRecording}>Stop</button>
        </div>
      ) : null}
    </div>
  );
}
