import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

let initPromise = null;

/**
 * Initialize MediaPipe HandLandmarker and set it on globalThis.
 * Safe to call multiple times - will only initialize once.
 * @returns {Promise<HandLandmarker>}
 */
export async function initHandLandmarker() {
  if (globalThis.LitHandLandmarker) {
    return globalThis.LitHandLandmarker;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm"
      );

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
        numHands: 2,
      });

      globalThis.LitHandLandmarker = handLandmarker;
      console.log("✅ MediaPipe HandLandmarker initialized");
      return handLandmarker;
    } catch (err) {
      console.error("❌ Failed to initialize MediaPipe HandLandmarker:", err);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Check if HandLandmarker is ready
 * @returns {boolean}
 */
export function isHandLandmarkerReady() {
  return !!globalThis.LitHandLandmarker;
}
