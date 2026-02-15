export function createFrameSampler({ fps = 12, onSample }) {
  const minDelta = 1000 / fps;
  let lastSampleMs = 0;

  const push = (frame) => {
    if (!frame || typeof frame.timestamp !== "number") return;
    if (frame.timestamp - lastSampleMs < minDelta) return;
    lastSampleMs = frame.timestamp;
    if (typeof onSample === "function") {
      onSample(frame);
    }
  };

  const reset = () => {
    lastSampleMs = 0;
  };

  return { push, reset };
}
