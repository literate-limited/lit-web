const WRIST_INDEX = 0;
const MIDDLE_MCP_INDEX = 9;

const distance = (a, b) => {
  const dx = (a?.x ?? 0) - (b?.x ?? 0);
  const dy = (a?.y ?? 0) - (b?.y ?? 0);
  const dz = (a?.z ?? 0) - (b?.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

export function normalizeHandFrame(frame) {
  const points = Array.isArray(frame?.points) ? frame.points : [];
  if (points.length === 0) return null;

  const origin = points[WRIST_INDEX] || points[0];
  const scaleAnchor = points[MIDDLE_MCP_INDEX] || points[1] || origin;
  const scale = distance(origin, scaleAnchor) || 1;

  return points.map((p) => ({
    x: ((p?.x ?? 0) - origin.x) / scale,
    y: ((p?.y ?? 0) - origin.y) / scale,
    z: ((p?.z ?? 0) - origin.z) / scale,
  }));
}

export function mirrorPoints(points) {
  if (!Array.isArray(points)) return [];
  return points.map((p) => ({ ...p, x: -p.x }));
}
