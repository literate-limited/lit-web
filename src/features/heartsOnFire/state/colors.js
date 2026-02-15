const paletteDefault = [
  { stop: 0, color: "#2563eb" }, // venous blue
  { stop: 0.5, color: "#8b5cf6" }, // purple
  { stop: 1, color: "#ef4444" }, // arterial red
];

const paletteColorBlind = [
  { stop: 0, color: "#2c7bb6" }, // blue
  { stop: 0.5, color: "#abd9e9" }, // light cyan
  { stop: 1, color: "#d7191c" }, // red-orange
];

function lerpColor(a, b, t) {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const rHex = Math.round(ar + (br - ar) * t)
    .toString(16)
    .padStart(2, "0");
  const gHex = Math.round(ag + (bg - ag) * t)
    .toString(16)
    .padStart(2, "0");
  const bHex = Math.round(ab + (bb - ab) * t)
    .toString(16)
    .padStart(2, "0");
  return `#${rHex}${gHex}${bHex}`;
}

export function saturationToColor(saturationPct = 75, colorBlindSafe = false) {
  const sat = Math.max(0, Math.min(100, saturationPct)) / 100;
  const palette = colorBlindSafe ? paletteColorBlind : paletteDefault;
  for (let i = 0; i < palette.length - 1; i += 1) {
    const cur = palette[i];
    const next = palette[i + 1];
    if (sat >= cur.stop && sat <= next.stop) {
      const localT = (sat - cur.stop) / (next.stop - cur.stop || 1);
      return lerpColor(cur.color, next.color, localT);
    }
  }
  return palette[palette.length - 1].color;
}
