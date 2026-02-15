export function applyNodeRepulsion(
  posById,
  nodes,
  {
    radiusFor,
    padding = 10,
    strength = 0.55,
    anchorStrength = 0.12,
    maxStep = 6,
    iterations = 10
  } = {}
) {
  const cur = new Map();
  for (const [id, p] of posById.entries()) cur.set(id, { x: p.x, y: p.y });

  const desired = posById;

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const pa = cur.get(a.id);
      if (!pa) continue;

      const ra = radiusFor(a);

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const pb = cur.get(b.id);
        if (!pb) continue;

        const rb = radiusFor(b);

        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dist = Math.hypot(dx, dy) || 1e-6;

        const minDist = ra + rb + padding;
        if (dist >= minDist) continue;

        // ✅ push by REAL overlap distance (not normalized)
        const overlapDist = minDist - dist;

        const nx = dx / dist;
        const ny = dy / dist;

        // scale + clamp so it stays stable
        const push = Math.min(maxStep, overlapDist) * strength;

        pa.x -= nx * push * 0.5;
        pa.y -= ny * push * 0.5;
        pb.x += nx * push * 0.5;
        pb.y += ny * push * 0.5;
      }
    }

    // gentle pull back to desired
    for (const n of nodes) {
      const p = cur.get(n.id);
      const d = desired.get(n.id);
      if (!p || !d) continue;

      const dx = d.x - p.x;
      const dy = d.y - p.y;

      p.x += Math.max(-maxStep, Math.min(maxStep, dx)) * anchorStrength;
      p.y += Math.max(-maxStep, Math.min(maxStep, dy)) * anchorStrength;
    }
  }

  return cur;
}
