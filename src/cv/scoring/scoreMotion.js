import { normalizeHandFrame, mirrorPoints } from "./normalize";
import { resampleClipUniform } from "./resample";

const DEFAULT_THRESHOLD = 0.7;
const MAX_NORM_DISTANCE = 0.5;
const MIN_VALID_FRAMES = 6;
const HANDEDNESS_CONFIDENCE = 0.6;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const meanDistance = (pointsA, pointsB) => {
  const count = Math.min(pointsA.length, pointsB.length);
  if (count === 0) return null;
  let sum = 0;
  for (let i = 0; i < count; i += 1) {
    const a = pointsA[i];
    const b = pointsB[i];
    const dx = (a?.x ?? 0) - (b?.x ?? 0);
    const dy = (a?.y ?? 0) - (b?.y ?? 0);
    const dz = (a?.z ?? 0) - (b?.z ?? 0);
    sum += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return sum / count;
};

const computeFrameDistance = (refFrame, userFrame, options) => {
  if (!refFrame || !userFrame) return null;

  const refHand = refFrame.handedness;
  const userHand = userFrame.handedness;
  const refConf = refFrame.confidence ?? 0;
  const userConf = userFrame.confidence ?? 0;

  const handMismatch =
    refHand !== "Unknown" &&
    userHand !== "Unknown" &&
    refHand !== userHand &&
    refConf >= HANDEDNESS_CONFIDENCE &&
    userConf >= HANDEDNESS_CONFIDENCE;

  if (handMismatch) return MAX_NORM_DISTANCE;

  const refPoints = normalizeHandFrame(refFrame);
  const userPoints = normalizeHandFrame(userFrame);

  if (!refPoints || !userPoints) return null;

  const distance = meanDistance(refPoints, userPoints);
  if (distance == null) return null;

  if (options?.allowMirror && refHand === "Unknown" && userHand === "Unknown") {
    const mirrored = meanDistance(refPoints, mirrorPoints(userPoints));
    if (mirrored != null) return Math.min(distance, mirrored);
  }

  return distance;
};

export function scoreMotion(refClip, userClip, options = {}) {
  const refFrames = Array.isArray(refClip?.frames) ? refClip.frames : [];
  const userFrames = Array.isArray(userClip?.frames) ? userClip.frames : [];

  const overlap = Math.min(refFrames.length, userFrames.length);
  if (overlap === 0) {
    return {
      pass: false,
      score: 0,
      metadata: { reason: "no_frames" },
    };
  }

  const frameCount = Math.min(overlap, options.maxFrames || overlap);
  const refSample = resampleClipUniform(refClip, frameCount);
  const userSample = resampleClipUniform(userClip, frameCount);

  const distances = [];
  for (let i = 0; i < frameCount; i += 1) {
    const dist = computeFrameDistance(refSample.frames[i], userSample.frames[i], {
      allowMirror: options.allowMirror,
    });
    if (typeof dist === "number") distances.push(dist);
  }

  if (distances.length < (options.minValidFrames || MIN_VALID_FRAMES)) {
    return {
      pass: false,
      score: 0,
      metadata: {
        reason: "insufficient_frames",
        validFrames: distances.length,
      },
    };
  }

  const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  const normalized = clamp(avgDistance / MAX_NORM_DISTANCE, 0, 1);
  const score = clamp(1 - normalized, 0, 1);

  const threshold =
    typeof options.successThreshold === "number"
      ? options.successThreshold
      : DEFAULT_THRESHOLD;

  return {
    pass: score >= threshold,
    score,
    metadata: {
      avgDistance,
      validFrames: distances.length,
      frameCount,
      threshold,
    },
  };
}
