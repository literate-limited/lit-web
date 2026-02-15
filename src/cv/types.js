// Internal CV types (JS doc only).
// These are intentionally lightweight to avoid leaking vendor types.

/**
 * @typedef {"hands"} TrackingTarget
 */

/**
 * @typedef {{ x: number, y: number, z?: number }} LandmarkPoint
 */

/**
 * @typedef {{
 *   points: LandmarkPoint[],
 *   handedness: "Left" | "Right" | "Unknown",
 *   confidence: number,
 *   timestampMs: number
 * }} LandmarkFrame
 */

/**
 * @typedef {{
 *   frames: LandmarkFrame[],
 *   fps: number,
 *   durationMs: number,
 *   target: TrackingTarget
 * }} MotionClip
 */

/**
 * @typedef {{
 *   pass: boolean,
 *   score: number,
 *   metadata?: Record<string, unknown>
 * }} MotionScore
 */

export {};
