import { extractLandmarks } from "../landmarks/handLandmarker";

const clipCache = new Map();

const waitForEvent = (target, eventName) =>
  new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      target.removeEventListener(eventName, onReady);
      target.removeEventListener("error", onError);
    };

    target.addEventListener(eventName, onReady, { once: true });
    target.addEventListener("error", onError, { once: true });
  });

const seekTo = async (video, time) => {
  if (!Number.isFinite(time)) return;
  if (Math.abs(video.currentTime - time) < 0.001) return;
  const seeked = waitForEvent(video, "seeked");
  video.currentTime = time;
  await seeked;
};

const createVideo = async (src) => {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = src;

  await waitForEvent(video, "loadedmetadata");
  await waitForEvent(video, "loadeddata");
  return video;
};

export async function getReferenceClip({
  videoId,
  src,
  target = "hands",
  fps = 12,
  onProgress,
}) {
  const cacheKey = `${videoId || src}|${target}|${fps}`;
  if (clipCache.has(cacheKey)) {
    return clipCache.get(cacheKey);
  }

  const clipPromise = (async () => {
    if (!src) throw new Error("Reference video source missing");

    const video = await createVideo(src);
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const frameCount = Math.max(1, Math.floor(duration * fps) || 1);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("Canvas context unavailable");

    const frames = [];

    for (let i = 0; i < frameCount; i += 1) {
      const t =
        frameCount > 1
          ? Math.min(duration - 0.001, (i / (frameCount - 1)) * duration)
          : 0;
      await seekTo(video, t);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const landmark = await extractLandmarks(
        { canvas, timestamp: t * 1000 },
        target
      );
      if (landmark) frames.push(landmark);

      if (typeof onProgress === "function") {
        onProgress({ current: i + 1, total: frameCount });
      }
    }

    if (frames.length === 0) {
      throw new Error("No landmarks detected in reference video.");
    }

    return {
      frames,
      fps,
      durationMs: duration * 1000,
      target,
    };
  })();

  clipCache.set(cacheKey, clipPromise);
  clipPromise.catch(() => clipCache.delete(cacheKey));
  return clipPromise;
}
