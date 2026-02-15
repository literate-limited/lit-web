import * as THREE from "three";
import { walk } from "./knowledgeTreeModel";

/**
 * Build a graph from your nested tree view.
 * Edges are parent-child (type: "parent").
 * Also returns appIdById and parentIdById so paletteFor can still work nicely in graph view.
 */
export function buildGraphFromTree(root) {
  const nodes = [];
  const edges = [];
  const nodeById = new Map();
  const parentIdById = new Map();
  const appIdById = new Map();

  walk(root, (node, parent, appId) => {
    if (!nodeById.has(node.id)) {
      nodes.push(node);
      nodeById.set(node.id, node);
    }
    parentIdById.set(node.id, parent?.id ?? null);
    appIdById.set(node.id, appId ?? null);

    if (parent) {
      edges.push({ from: parent.id, to: node.id, type: "parent" });
    }
  });

  return { nodes, edges, nodeById, parentIdById, appIdById };
}

/**
 * Lightweight 2D force layout (spatial-hashed repulsion + springs).
 * Positions live in X/Y plane (Z=0).
 */
export function createForce2DLayout(graph, opts = {}) {
  const {
    width = 90,
    height = 90,
    pinnedIds = [],
    // physics params (tweakable)
    cellSize = 18,
    repulsionRange = 26,
    repulsionStrength = 260,
    springLength = 10,
    springStrength = 0.012,
    centerStrength = 0.002,
    damping = 0.86,
    maxSpeed = 2.2
  } = opts;

  const pinned = new Set(pinnedIds);

  const posById = new Map();
  const velById = new Map(); // Vector2 velocity

  for (const n of graph.nodes) {
    const x = (Math.random() - 0.5) * width;
    const y = (Math.random() - 0.5) * height;
    posById.set(n.id, new THREE.Vector3(x, y, 0));
    velById.set(n.id, new THREE.Vector2(0, 0));
  }

  // Optional: anchor pinned nodes to origin (common: root)
  for (const id of pinned) {
    const p = posById.get(id);
    const v = velById.get(id);
    if (p) p.set(0, 0, 0);
    if (v) v.set(0, 0);
  }

  // Pre-pack edges for faster spring loop
  const edges = graph.edges.map((e) => ({ from: e.from, to: e.to }));

  function gridKey(x, y) {
    return `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
  }

  function buildSpatialGrid() {
    const grid = new Map(); // key -> ids[]
    for (const [id, p] of posById) {
      const k = gridKey(p.x, p.y);
      const bucket = grid.get(k);
      if (bucket) bucket.push(id);
      else grid.set(k, [id]);
    }
    return grid;
  }

  function forNeighborIds(grid, p, fn) {
    const cx = Math.floor(p.x / cellSize);
    const cy = Math.floor(p.y / cellSize);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const k = `${cx + dx},${cy + dy}`;
        const bucket = grid.get(k);
        if (!bucket) continue;
        for (const otherId of bucket) fn(otherId);
      }
    }
  }

  function step(iterations = 1) {
    for (let it = 0; it < iterations; it++) {
      const grid = buildSpatialGrid();

      // Accumulate forces into velocity (repulsion + centering)
      for (const [id, p] of posById) {
        const v = velById.get(id);
        if (!v) continue;

        if (pinned.has(id)) {
          v.set(0, 0);
          continue;
        }

        // gentle pull to origin (keeps graph from drifting off)
        v.x += -p.x * centerStrength;
        v.y += -p.y * centerStrength;

        forNeighborIds(grid, p, (otherId) => {
          if (otherId === id) return;

          const op = posById.get(otherId);
          if (!op) return;

          const dx = p.x - op.x;
          const dy = p.y - op.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 1e-6) return;

          const dist = Math.sqrt(d2);
          if (dist > repulsionRange) return;

          // inverse-square repulsion
          const f = repulsionStrength / d2;
          const nx = dx / dist;
          const ny = dy / dist;

          v.x += nx * f * 0.02; // scaled down so it’s stable
          v.y += ny * f * 0.02;
        });
      }

      // Springs along edges
      for (const e of edges) {
        const a = posById.get(e.from);
        const b = posById.get(e.to);
        if (!a || !b) continue;

        const av = velById.get(e.from);
        const bv = velById.get(e.to);
        if (!av || !bv) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1e-6;

        const diff = dist - springLength;
        const f = springStrength * diff;

        const nx = dx / dist;
        const ny = dy / dist;

        if (!pinned.has(e.from)) {
          av.x += nx * f;
          av.y += ny * f;
        }
        if (!pinned.has(e.to)) {
          bv.x -= nx * f;
          bv.y -= ny * f;
        }
      }

      // Integrate
      for (const [id, p] of posById) {
        const v = velById.get(id);
        if (!v) continue;

        if (pinned.has(id)) {
          p.set(0, 0, 0);
          v.set(0, 0);
          continue;
        }

        // damping
        v.multiplyScalar(damping);

        // clamp speed
        const sp = v.length();
        if (sp > maxSpeed) v.multiplyScalar(maxSpeed / sp);

        p.x += v.x;
        p.y += v.y;
        p.z = 0;
      }
    }
  }

  /**
   * Fill a Float32Array edge position buffer for LineSegments:
   * [ax,ay,0, bx,by,0, ...]
   */
  function writeEdgesToPositionsArray(arr) {
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const a = posById.get(e.from);
      const b = posById.get(e.to);
      const o = i * 6;

      if (!a || !b) {
        arr[o + 0] = arr[o + 1] = arr[o + 2] = 0;
        arr[o + 3] = arr[o + 4] = arr[o + 5] = 0;
        continue;
      }

      arr[o + 0] = a.x;
      arr[o + 1] = a.y;
      arr[o + 2] = 0;

      arr[o + 3] = b.x;
      arr[o + 4] = b.y;
      arr[o + 5] = 0;
    }
  }

  return { posById, edges, step, writeEdgesToPositionsArray };
}
