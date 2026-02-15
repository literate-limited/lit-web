const HAND_TARGET = "hands";

const getGlobalLandmarker = () => {
  if (typeof globalThis === "undefined") return null;
  return (
    globalThis.LitHandLandmarker ||
    globalThis.handLandmarker ||
    globalThis.HandLandmarker ||
    null
  );
};

const pickBestHandIndex = (handednesses = []) => {
  if (!Array.isArray(handednesses) || handednesses.length === 0) return 0;
  let bestIdx = 0;
  let bestScore = -1;
  handednesses.forEach((entry, idx) => {
    const score = entry?.score ?? entry?.confidence ?? 0;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  });
  return bestIdx;
};

const normalizeHandedness = (entry) => {
  const raw = entry?.categoryName || entry?.label || "Unknown";
  if (raw === "Left" || raw === "Right") return raw;
  return "Unknown";
};

export async function extractLandmarks(frame, target = HAND_TARGET) {
  if (target !== HAND_TARGET) return null;

  const landmarker = getGlobalLandmarker();
  if (!landmarker || typeof landmarker.detect !== "function") {
    throw new Error("Hand landmarker not available on window.LitHandLandmarker");
  }

  const image = frame?.imageBitmap || frame?.image || frame?.canvas;
  if (!image) return null;

  const result = await landmarker.detect(image);
  if (!result) return null;

  const handLandmarks =
    result?.landmarks || result?.multiHandLandmarks || result?.hands || [];
  const handednesses =
    result?.handednesses || result?.multiHandedness || result?.handedness || [];

  if (!Array.isArray(handLandmarks) || handLandmarks.length === 0) return null;

  const idx = pickBestHandIndex(handednesses);
  const points = handLandmarks[idx] || handLandmarks[0];
  if (!Array.isArray(points) || points.length === 0) return null;

  const handEntry = Array.isArray(handednesses) ? handednesses[idx] : null;
  const handedness = normalizeHandedness(handEntry);
  const confidence = handEntry?.score ?? handEntry?.confidence ?? 0;

  return {
    points: points.map((p) => ({ x: p.x, y: p.y, z: p.z })),
    handedness,
    confidence,
    timestampMs: typeof frame.timestamp === "number" ? frame.timestamp : Date.now(),
  };
}
