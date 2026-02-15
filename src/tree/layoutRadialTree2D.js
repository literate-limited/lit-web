import { walk } from "./knowledgeTreeModel";
import { hash01, polarToXY } from "./svgUtils";

// Weight by leaves so big subtrees get more angular space
function computeSubtreeWeight(node) {
  const kids = node.children || [];
  if (kids.length === 0) return 1;
  let sum = 0;
  for (const c of kids) sum += computeSubtreeWeight(c);
  return Math.max(1, sum);
}

/**
 * Organic radial layout:
 * - root at (0,0)
 * - each root child gets an angular sector (“continent”)
 * - each node subdivides its sector among children (weighted)
 * - depth -> radius (ring spacing)
 * - deterministic jitter -> “alive” but stable
 */
export function layoutRadialTree2D(root, { ring = 160, base = 0, spiral = 0.18 } = {}) {
  const posById = new Map();
  const sectorById = new Map(); // id -> {a0,a1}
  const weightById = new Map();
  const depthById = new Map();

  // depth BFS
  depthById.set(root.id, 0);
  const q = [root];
  while (q.length) {
    const n = q.shift();
    const d = depthById.get(n.id) ?? 0;
    for (const c of n.children || []) {
      depthById.set(c.id, d + 1);
      q.push(c);
    }
  }

  // weights
  walk(root, (node) => {
    weightById.set(node.id, computeSubtreeWeight(node));
  });

  // root sector is full circle
  sectorById.set(root.id, { a0: -Math.PI, a1: Math.PI });
  posById.set(root.id, { x: 0, y: 0 });

  // Give each root child its own “continent”
  const topKids = root.children || [];
  const N = Math.max(1, topKids.length);
  const baseStep = (Math.PI * 2) / N;

  // Jittered centers, but keep ordering stable
  const topAngles = topKids.map((c, i) => {
    const j = (hash01(c.id + ":top") - 0.5) * baseStep * 0.22;
    return i * baseStep + j - Math.PI; // around circle
  });

  // Build top-level sectors around each angle
  for (let i = 0; i < topKids.length; i++) {
    const kid = topKids[i];
    const center = topAngles[i];

    // soft sector size so there’s breathing room between continents
    const width = baseStep * 0.82;
    const a0 = center - width / 2;
    const a1 = center + width / 2;

    sectorById.set(kid.id, { a0, a1 });
  }

  function placeNode(node) {
    const depth = depthById.get(node.id) ?? 0;
    const sector = sectorById.get(node.id) || sectorById.get(root.id);

    const mid = (sector.a0 + sector.a1) / 2;

    // deterministic “organic” jitter
    const jA = (hash01(node.id + ":a") - 0.5) * (sector.a1 - sector.a0) * 0.20;
    const jR = (hash01(node.id + ":r") - 0.5) * ring * 0.20;

    // spiral twist so it feels like it’s flowing outward
    const twist = depth * spiral + (hash01(node.id + ":tw") - 0.5) * 0.10;

    let r = base + depth * ring + jR;

    if (node.type === "app") r = base + ring * 1.0 + jR * 0.55;
    if ((node.children || []).length === 0) r += ring * 0.10;

    const angle = mid + jA + twist;
    const p = polarToXY(r, angle);

    // small sideways wobble (perpendicular to radial direction)
    const wob = (hash01(node.id + ":w") - 0.5) * ring * 0.08;
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    p.x += nx * wob;
    p.y += ny * wob;

    posById.set(node.id, p);
  }

  function subdivide(parent) {
    const kids = parent.children || [];
    if (kids.length === 0) return;

    const parentSector = sectorById.get(parent.id) || { a0: -Math.PI, a1: Math.PI };
    const span = parentSector.a1 - parentSector.a0;

    // leave some padding inside each sector
    const innerPad = span * 0.06;
    const a0 = parentSector.a0 + innerPad;
    const a1 = parentSector.a1 - innerPad;

    const totalW =
      kids.reduce((acc, c) => acc + (weightById.get(c.id) ?? 1), 0) || 1;

    let cur = a0;
    for (const c of kids) {
      const w = weightById.get(c.id) ?? 1;
      const share = (a1 - a0) * (w / totalW);

      // tiny deterministic gap so siblings don’t look too evenly sliced
      const gap = (hash01(parent.id + "->" + c.id + ":gap") * 0.02 + 0.01) * span;

      const childA0 = cur + gap * 0.5;
      const childA1 = cur + share - gap * 0.5;

      sectorById.set(c.id, {
        a0: childA0,
        a1: Math.max(childA0 + 0.02, childA1)
      });

      cur += share;

      placeNode(c);
      subdivide(c);
    }
  }

  // Place top kids, then recurse
  for (const kid of topKids) {
    placeNode(kid);
    subdivide(kid);
  }

  return posById;
}
