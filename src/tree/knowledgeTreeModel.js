import * as THREE from "three";

// ------------------ tree walk helpers ------------------
export function walk(node, fn, parent = null, appId = null, visited = new Set()) {
  if (!node || visited.has(node)) return;
  visited.add(node);

  const nextAppId = node.type === "app" ? node.id : appId;
  fn(node, parent, nextAppId);
  (node.children || []).forEach((c) => walk(c, fn, node, nextAppId, visited));
}

export function nodeRadius(type) {
  switch (type) {
    case "root":
      return 1.2;
    case "app":
      return 0.85;
    case "branch":
      return 0.55;
    case "alveolus":
      return 0.46;
    default:
      return 0.55;
  }
}

// ------------------ palette ------------------
const PALETTES = {
  "app:true-phonetics": { base: 0xcfe8ff, emissive: 0x2b7cff, ei: 0.75 },
  "app:literate": { base: 0xffd6d6, emissive: 0xff2a2a, ei: 0.7 },
  "app:math-madness": { base: 0xfff0b8, emissive: 0xffc400, ei: 0.75 },
  "app:scythe-science": { base: 0xd8ffd8, emissive: 0x00b85a, ei: 0.7 },
  "app:politica": { base: 0xecd8ff, emissive: 0x7a2cff, ei: 0.7 },
  "app:historica": { base: 0xe5fff4, emissive: 0x35c98a, ei: 0.55 },
  "app:medicinica": { base: 0xe8f1ff, emissive: 0x2f6bff, ei: 0.55 },
  "app:debatica": { base: 0x111111, emissive: 0x000000, ei: 0.2 },
  "app:yinyang": { base: 0xffffff, emissive: 0xffffff, ei: 0.35 },
  "app:eagle-engineering": { base: 0xf7f7ff, emissive: 0xffd100, ei: 0.55 },
  "app:code-monkey": { base: 0xe6e1d6, emissive: 0x2a7bff, ei: 0.35 },
  "app:danceon": { base: 0xf7f7f7, emissive: 0xffffff, ei: 0.25 },
  "app:mem-wise": { base: 0xf0e8ff, emissive: 0x9b7cff, ei: 0.35 },
  "app:lore": { base: 0xe8e8e8, emissive: 0x777777, ei: 0.25 }
};

export function paletteFor(node, appId, parent) {
  if (
    node.id?.startsWith("lore:lore-lore") ||
    parent?.id?.startsWith("lore:lore-lore")
  ) {
    return { base: 0xe7e0d6, emissive: 0x8b6f4e, ei: 0.25 };
  }
  if (
    node.id?.startsWith("lore:law-lore") ||
    parent?.id?.startsWith("lore:law-lore")
  ) {
    return { base: 0xe5e5e5, emissive: 0x777777, ei: 0.28 };
  }
  return PALETTES[appId] || { base: 0xd6d6df, emissive: 0x333344, ei: 0.18 };
}

// ------------------ DB -> renderer tree ------------------
function typeFromDb(nodeKey, level) {
  if (level === "root") return "root";
  if (level === "domain" && String(nodeKey).startsWith("app:")) return "app";
  if (level === "subtopic") return "alveolus";
  return "branch";
}

export function buildNestedTreeFromDb(payload) {
  const { tree, nodes } = payload || {};
  if (!tree?.rootNodeKey) throw new Error("Invalid payload: missing tree.rootNodeKey");
  if (!Array.isArray(nodes)) throw new Error("Invalid payload: nodes must be an array");

  const byId = new Map();

  for (const n of nodes) {
    const id = n.nodeKey;
    byId.set(id, {
      id,
      label: n.label,
      icon: n.icon ?? null,
      type: typeFromDb(id, n.level),
      level: n.level,
      order: n.order ?? 0,
      accepts: n.accepts ?? [],
      primaryParentKey: n.primaryParentKey || n.parentKey || null,
      children: []
    });
  }

  for (const n of nodes) {
    const child = byId.get(n.nodeKey);
    if (!child) continue;

    const parentKey = n.primaryParentKey || n.parentKey;
    if (!parentKey || parentKey === n.nodeKey) continue;

    const parent = byId.get(parentKey);
    if (!parent) continue;

    // Skip links that would create a cycle (defensive against bad data)
    let ancestor = parent;
    let hasCycle = false;
    while (ancestor) {
      if (ancestor.id === child.id) {
        hasCycle = true;
        break;
      }
      const nextParentKey = ancestor.primaryParentKey;
      if (!nextParentKey || nextParentKey === ancestor.id) break;
      ancestor = byId.get(nextParentKey);
    }
    if (hasCycle) continue;

    parent.children.push(child);
  }

  for (const node of byId.values()) {
    node.children.sort((a, b) => {
      const ao = a.order ?? 0;
      const bo = b.order ?? 0;
      if (ao !== bo) return ao - bo;
      return a.id.localeCompare(b.id);
    });
  }

  const root = byId.get(tree.rootNodeKey);
  if (!root) throw new Error(`Root node not found in nodes: ${tree.rootNodeKey}`);
  return root;
}

// ------------------ spiral layout ------------------
export function buildSpiralLayout(root) {
  const nodes = [];
  const parentById = new Map();
  const appById = new Map();
  const nodeById = new Map();

  walk(root, (node, parent, appId) => {
    nodes.push(node);
    nodeById.set(node.id, node);
    parentById.set(node.id, parent?.id ?? null);
    appById.set(node.id, appId);
  });

  const depthById = new Map();
  depthById.set(root.id, 0);

  const q = [root];
  while (q.length) {
    const n = q.shift();
    const d = depthById.get(n.id) ?? 0;
    (n.children || []).forEach((c) => {
      depthById.set(c.id, d + 1);
      q.push(c);
    });
  }

  const apps = (root.children || []).filter((c) => c.type === "app");
  const appAngles = new Map();
  const baseAngleStep = (Math.PI * 2) / Math.max(apps.length, 1);

  apps.forEach((app, i) => {
    const jitter = (Math.random() - 0.5) * 0.35;
    appAngles.set(app.id, i * baseAngleStep + jitter);
  });

  const hash01 = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 10000) / 10000;
  };

  const posById = new Map();

  nodes.forEach((node) => {
    const depth = depthById.get(node.id) ?? 0;
    const parentId = parentById.get(node.id);
    const parentNode = parentId ? nodeById.get(parentId) : null;
    const appId = appById.get(node.id);

    if (node.type === "root") {
      posById.set(node.id, new THREE.Vector3(0, 0, 0));
      return;
    }

    const yStep = 5.8;
    let y = depth * yStep;
    y += (hash01(node.id + ":y") - 0.5) * 2.2;

    const baseRadius = 3.5;
    const radiusGrowth = 1.45;
    let r = baseRadius + depth * radiusGrowth;

    if (node.type === "branch") r *= 0.92;
    if (node.type === "alveolus") r *= 1.02;

    r += (hash01(node.id + ":r") - 0.5) * 1.8;

    const appAngle = appId && appAngles.has(appId) ? appAngles.get(appId) : 0;
    const drift = depth * (0.55 + (hash01(node.id + ":d") - 0.5) * 0.35);

    let local = 0;
    if (parentNode) {
      const siblingIndex =
        (parentNode.children || []).findIndex((c) => c.id === node.id) || 0;
      const sibCount = Math.max((parentNode.children || []).length, 1);
      local = (siblingIndex / sibCount - 0.5) * 0.85;
    }

    const angle =
      appAngle +
      drift +
      local +
      (hash01(node.id + ":a") - 0.5) * 0.35;

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    posById.set(node.id, new THREE.Vector3(x, y, z));
  });

  return { posById, parentById, appById, nodeById, depthById };
}
