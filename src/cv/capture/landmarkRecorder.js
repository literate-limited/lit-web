import { createFrameSampler } from "./frameSampler";
import { extractLandmarks } from "../landmarks/handLandmarker";

export function createLandmarkRecorder({ fps = 12, target = "hands" }) {
  const frames = [];
  let isRecording = false;
  let startedAt = 0;
  let lastTimestampMs = 0;
  let busy = false;

  const sampler = createFrameSampler({
    fps,
    onSample: async (frame) => {
      if (!isRecording || busy) return;
      busy = true;
      try {
        const landmark = await extractLandmarks(frame, target);
        if (landmark) {
          frames.push(landmark);
          lastTimestampMs = landmark.timestampMs;
        }
      } catch (err) {
        // Ignore per-frame errors; the caller can handle low frame count.
        console.warn("Landmark extraction failed:", err);
      } finally {
        busy = false;
      }
    },
  });

  const start = () => {
    frames.length = 0;
    sampler.reset();
    startedAt = performance.now();
    lastTimestampMs = 0;
    isRecording = true;
  };

  const stop = () => {
    isRecording = false;
    const durationMs = frames.length
      ? Math.max(0, lastTimestampMs - frames[0].timestampMs)
      : Math.max(0, performance.now() - startedAt);
    return {
      frames: [...frames],
      fps,
      durationMs,
      target,
    };
  };

  return {
    onFrame: sampler.push,
    start,
    stop,
    getFrames: () => [...frames],
  };
}
