export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function hash01(s) {
  // deterministic 0..1
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

export function hexToCss(hex) {
  const s = Number(hex).toString(16).padStart(6, "0");
  return `#${s}`;
}

export function polarToXY(r, a) {
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

export function edgePath(a, b, key, curviness = 0.22) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;

  const px = -dy / len;
  const py = dx / len;

  // deterministic bend direction + strength
  const k = (hash01(key) - 0.5) * 2; // -1..1
  const bend = len * curviness * k;

  const cx = mx + px * bend;
  const cy = my + py * bend;

  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}
