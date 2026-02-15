import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { makeTextSprite } from "./textSprite";
import {
  walk,
  nodeRadius,
  paletteFor,
  buildNestedTreeFromDb,
  buildSpiralLayout,
} from "./knowledgeTreeModel";
import { makeBranchTube, makeSparks, makeOrbAsset } from "./knowledgeTreeAssets";
import TreeOfKnowledgeDiagram2D from "./TreeOfKnowledgeDiagram2D";
import { DEFAULT_TREE_KEY, DEFAULT_SUBTREE_APP, API_URL } from "./config";

function readSubtreeFromUrl() {
  try {
    const sp = new URLSearchParams(window.location.search);
    const val = sp.get("subtree") || sp.get("app") || "";
    return val === "all" ? "" : val;
  } catch {
    return "";
  }
}

function writeSubtreeToUrl(subtree) {
  try {
    const url = new URL(window.location.href);
    if (!subtree) {
      url.searchParams.delete("subtree");
      url.searchParams.delete("app");
    } else {
      url.searchParams.set("subtree", subtree);
    }
    window.history.replaceState({}, "", url.toString());
  } catch {
    // ignore
  }
}

/**
 * Project a single canonical DB tree into "one app-tree at a time".
 * Keep:
 *  - root node (root:fire) so the trunk/fire visuals still work
 *  - all nodes whose pathKeys include the selected appId
 *  - the app node itself (defensive)
 */
function projectPayloadToSubtree(payload, subtreeAppId) {
  if (!payload?.tree?.rootNodeKey || !Array.isArray(payload?.nodes)) return null;

  const rootKey = payload.tree.rootNodeKey;
  if (!subtreeAppId || subtreeAppId === rootKey) return payload;

  const nodes = payload.nodes;
  const nodeById = new Map(nodes.map((n) => [n?.nodeKey, n]).filter(([k]) => !!k));
  const target = nodeById.get(subtreeAppId);
  if (!target) return payload; // if bad key, keep the full tree so UI still works

  // Build parent->children map so we can walk descendants even if pathKeys are missing
  const childrenByParent = new Map();
  for (const n of nodes) {
    if (!n) continue;
    const p = n.primaryParentKey || n.parentKey;
    if (!p) continue;
    if (!childrenByParent.has(p)) childrenByParent.set(p, []);
    childrenByParent.get(p).push(n);
  }

  const allowed = new Set([rootKey, subtreeAppId]);

  // Include any node whose pathKeys already include the subtree (preferred)
  for (const n of nodes) {
    if (Array.isArray(n?.pathKeys) && n.pathKeys.includes(subtreeAppId)) {
      allowed.add(n.nodeKey);
    }
  }

  // Fallback: walk descendants via primaryParentKey/parentKey
  const q = [target];
  while (q.length) {
    const cur = q.shift();
    const kids = childrenByParent.get(cur.nodeKey) || [];
    for (const child of kids) {
      if (allowed.has(child.nodeKey)) continue;
      allowed.add(child.nodeKey);
      q.push(child);
    }
  }

  return {
    tree: payload.tree,
    nodes: nodes.filter((n) => n && allowed.has(n.nodeKey)),
  };
}

function deriveAppNodes(payload) {
  const rootKey = payload?.tree?.rootNodeKey;
  const nodes = Array.isArray(payload?.nodes) ? payload.nodes : [];
  const seen = new Set();

  const apps = nodes
    .filter((n) => {
      if (!n) return false;
      if (n.level === "domain") return true;
      if (n.seedType === "app") return true;
      if (typeof n.nodeKey === "string" && n.nodeKey.startsWith("app:")) return true;
      const parent = n.primaryParentKey ?? n.parentKey;
      if (rootKey && parent === rootKey) return true;
      if (rootKey && Array.isArray(n.parentKeys) && n.parentKeys.includes(rootKey)) return true;
      return false;
    })
    .map((n) => ({
      id: n.nodeKey,
      label: n.label || n.name || String(n.nodeKey).replace(/^app:/, ""),
      order: typeof n.order === "number" ? n.order : 0,
    }))
    .filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    })
    .sort((a, b) => (a.order - b.order) || a.id.localeCompare(b.id));

  return apps;
}

export default function TreeOfKnowledge3D({ treeKey: treeKeyProp = DEFAULT_TREE_KEY } = {}) {
  const TREE_KEY = treeKeyProp || DEFAULT_TREE_KEY;
  const mountRef = useRef(null);
  const rafRef = useRef(null);

  const [selected, setSelected] = useState(null);

  // "tree" (ThreeJS) vs "diagram" (white SVG)
  const [viewMode, setViewMode] = useState("tree");

  // Raw payload from API (canonical graph)
  const [payload, setPayload] = useState(null);

  // Which app-subtree are we viewing?
  const [activeSubtree, setActiveSubtree] = useState(readSubtreeFromUrl() || DEFAULT_SUBTREE_APP);

  // Available apps for the dropdown (derived from payload.nodes)
  const [apps, setApps] = useState([]); // [{ id, label, order }]

  const [loadErr, setLoadErr] = useState(null);

  // Fetch canonical payload once
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadErr(null);

        if (!API_URL) {
          throw new Error(
            "VITE_API_URL is not set (expected e.g. http://localhost:8000/api/v1)"
          );
        }

        const res = await fetch(`${API_URL}/knowledge-trees/${TREE_KEY}`);
        if (!res.ok) throw new Error(`Failed to load tree (HTTP ${res.status})`);
        const p = await res.json();

        if (!alive) return;

        setPayload(p);

        // Derive app nodes for dropdown from canonical list
        const appNodes = deriveAppNodes(p);

        setApps(appNodes);

        // If there are no domain nodes, show the full tree
        if (appNodes.length === 0) {
          setActiveSubtree("");
          writeSubtreeToUrl("");
          return;
        }

        // If URL asked for a subtree that doesn't exist, fall back to the first domain
        const exists = appNodes.some((a) => a.id === activeSubtree);
        if (!exists) {
          const fallback = appNodes[0]?.id || DEFAULT_SUBTREE_APP;
          setActiveSubtree(fallback);
          writeSubtreeToUrl(fallback);
        }
      } catch (e) {
        if (alive) setLoadErr(String(e?.message || e));
      }
    })();

    return () => {
      alive = false;
    };
  }, [TREE_KEY]);

  // Project canonical payload into the currently selected subtree, then build nested tree
  const rootData = useMemo(() => {
    if (!payload) return null;

    const projected = projectPayloadToSubtree(payload, activeSubtree);
    if (!projected) return null;

    // This still uses root:fire as root, but ONLY keeps one app subtree,
    // so visually it becomes “one tree at a time”.
    return buildNestedTreeFromDb(projected);
  }, [payload, activeSubtree]);

  // keep URL in sync when switching apps
  useEffect(() => {
    writeSubtreeToUrl(activeSubtree);
    setSelected(null);
  }, [activeSubtree]);

  // ThreeJS scene (ONLY in 3D mode)
  useEffect(() => {
    if (viewMode !== "tree") return;

    const mount = mountRef.current;
    if (!mount) return;
    if (!rootData) return;

    // ---- scene ----
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07070c);

    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      3000
    );
    camera.position.set(0, 18, 46);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 260;
    controls.minDistance = 6;

    // ---- orb textures ----
    const texLoader = new THREE.TextureLoader();
    const scytheLogoTex = texLoader.load("/orbs/scythe-science.png");
    if (THREE.SRGBColorSpace) scytheLogoTex.colorSpace = THREE.SRGBColorSpace;
    scytheLogoTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    scytheLogoTex.minFilter = THREE.LinearMipMapLinearFilter;
    scytheLogoTex.magFilter = THREE.LinearFilter;

    const billboardLogoSprites = []; // { sprite, parentGroup, radius }

    // ---- lights ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(40, 70, 30);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xffffff, 0.55);
    rim.position.set(-35, 25, -40);
    scene.add(rim);

    // ---- group ----
    const group = new THREE.Group();
    scene.add(group);

    // ---- ground ----
    const groundGeom = new THREE.CircleGeometry(160, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0b0b12,
      roughness: 0.95,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    group.add(ground);

    const ring = new THREE.RingGeometry(18, 18.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x1b1b28,
      transparent: true,
      opacity: 0.45,
    });
    const ringMesh = new THREE.Mesh(ring, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.01;
    group.add(ringMesh);

    // ---- trunk ----
    const trunkHeight = 60;
    const trunkGeom = new THREE.CylinderGeometry(1.35, 2.1, trunkHeight, 18, 1);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a22,
      roughness: 0.85,
      metalness: 0.05,
    });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.position.set(0, trunkHeight / 2, 0);
    group.add(trunk);

    // ---- root fire ----
    const fire = makeTextSprite("🔥", { fontSize: 96, padding: 22 });
    fire.position.set(0, 1.6, 0);
    group.add(fire);

    const sparks = makeSparks(180);
    sparks.position.set(0, 0.05, 0);
    group.add(sparks);

    // ---- build layout ----
    const { posById } = buildSpiralLayout(rootData);

    const yLift = 2.8;
    posById.forEach((p, id) => {
      if (id !== rootData.id) p.y += yLift;
    });

    // ---- meshes for raycast ----
    const nodeMeshes = [];
    const meshById = new Map();

    // ---- branch tubes ----
    walk(rootData, (node, parent, appId) => {
      if (!parent) return;

      const start = posById.get(parent.id);
      const end = posById.get(node.id);
      if (!start || !end) return;

      const thickness =
        0.12 +
        (node.type === "app" ? 0.06 : 0) +
        (node.type === "root" ? 0.1 : 0);

      const pal = paletteFor(node, appId, parent);
      const tubeGeom = makeBranchTube(start, end, thickness, 0.9);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: pal.base,
        emissive: pal.emissive,
        emissiveIntensity: Math.min(0.6, pal.ei),
        roughness: 0.55,
        metalness: 0.05,
        transparent: true,
        opacity: 0.95,
      });

      // keep your spice
      if (appId === "app:medicinica" && Math.random() < 0.35) {
        tubeMat.emissive = new THREE.Color(0xff2a2a);
        tubeMat.emissiveIntensity = 0.18;
      }

      const tube = new THREE.Mesh(tubeGeom, tubeMat);
      group.add(tube);
    });

    // ---- nodes ----
    walk(rootData, (node, parent, appId) => {
      const p = posById.get(node.id);
      if (!p) return;

      const pal = paletteFor(node, appId, parent);

      // Root node: invisible hit target
      if (node.type === "root") {
        const geom = new THREE.SphereGeometry(1.4, 22, 16);
        const mat = new THREE.MeshStandardMaterial({
          transparent: true,
          opacity: 0.0,
        });
        const hit = new THREE.Mesh(geom, mat);
        hit.position.copy(p);

        hit.userData = {
          id: node.id,
          label: node.label,
          type: node.type,
          accepts: node.accepts || null,
          appId,
        };

        group.add(hit);
        nodeMeshes.push(hit);
        meshById.set(node.id, hit);
        return;
      }

      const r = nodeRadius(node.type);

      // Special orb (kept)
      if (node.type === "app" && node.id === "app:scythe-science") {
        const { group: orbGroup, hitMesh, logoSprite } = makeOrbAsset({
          radius: r * 1.08,
          pal,
          logoTex: scytheLogoTex,
        });

        orbGroup.position.copy(p);

        hitMesh.userData = {
          id: node.id,
          label: node.label,
          type: node.type,
          accepts: node.accepts || null,
          appId,
        };

        const labelText = node.icon ? `${node.icon} ${node.label}` : node.label;
        const label = makeTextSprite(labelText, { fontSize: 46, padding: 16 });
        label.position.set(0, r + 0.95, 0);
        orbGroup.add(label);

        group.add(orbGroup);
        nodeMeshes.push(hitMesh);
        meshById.set(node.id, orbGroup);

        billboardLogoSprites.push({
          sprite: logoSprite,
          parentGroup: orbGroup,
          radius: r * 1.08,
        });
        return;
      }

      // Default spheres
      const geom = new THREE.SphereGeometry(r, 22, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: pal.base,
        emissive: pal.emissive,
        emissiveIntensity:
          node.type === "app" ? pal.ei : Math.max(0.15, pal.ei * 0.55),
        roughness: 0.38,
        metalness: 0.08,
        transparent: true,
        opacity: 0.98,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(p);

      mesh.userData = {
        id: node.id,
        label: node.label,
        type: node.type,
        accepts: node.accepts || null,
        appId,
      };

      const labelText = node.icon ? `${node.icon} ${node.label}` : node.label;
      const label = makeTextSprite(labelText, {
        fontSize: node.type === "app" ? 46 : 38,
        padding: 16,
      });
      label.position.set(0, r + 0.95, 0);
      mesh.add(label);

      group.add(mesh);
      nodeMeshes.push(mesh);
      meshById.set(node.id, mesh);
    });

    // ---- highlight ring ----
    const ringGeom2 = new THREE.TorusGeometry(1.2, 0.12, 18, 42);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00ffcc,
      emissiveIntensity: 0.65,
      roughness: 0.3,
    });
    const highlight = new THREE.Mesh(ringGeom2, ringMat2);
    highlight.visible = false;
    group.add(highlight);

    // ---- raycast click ----
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onPointerDown(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(nodeMeshes, true);
      const hit = hits.find((h) => h.object?.userData?.id);
      if (!hit) return;

      const data = hit.object.userData;
      setSelected(data);

      const anchor = meshById.get(data.id);
      if (anchor) {
        let rr = nodeRadius(data.type);
        if (data.id === "app:scythe-science") rr *= 1.08;

        highlight.scale.set(rr / 0.75, rr / 0.75, rr / 0.75);
        highlight.position.copy(anchor.position);
        highlight.rotation.x = Math.PI / 2;
        highlight.visible = true;
      }
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    // ---- resize ----
    function onResize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    // ---- animate ----
    const sparkGeom = sparks.geometry;
    const sparkPos = sparkGeom.getAttribute("position");
    const vels = sparkGeom.userData.velocities;

    const _camWorld = new THREE.Vector3();
    const _orbWorld = new THREE.Vector3();
    const _targetWorld = new THREE.Vector3();

    let t = 0;
    const tick = () => {
      t += 0.01;

      // sparks
      for (let i = 0; i < sparkPos.count; i++) {
        const ix = i * 3;
        sparkPos.array[ix + 0] += vels[ix + 0];
        sparkPos.array[ix + 1] += vels[ix + 1] * 0.03;
        sparkPos.array[ix + 2] += vels[ix + 2];

        sparkPos.array[ix + 0] += Math.sin(t + i) * 0.0012;
        sparkPos.array[ix + 2] += Math.cos(t + i) * 0.0012;

        if (sparkPos.array[ix + 1] > 6.0) {
          sparkPos.array[ix + 0] = (Math.random() - 0.5) * 0.9;
          sparkPos.array[ix + 1] = Math.random() * 0.35;
          sparkPos.array[ix + 2] = (Math.random() - 0.5) * 0.9;

          vels[ix + 0] = (Math.random() - 0.5) * 0.08;
          vels[ix + 1] = 0.25 + Math.random() * 0.45;
          vels[ix + 2] = (Math.random() - 0.5) * 0.08;
        }
      }
      sparkPos.needsUpdate = true;

      // billboard logo sprites (Scythe orb)
      camera.getWorldPosition(_camWorld);
      for (const b of billboardLogoSprites) {
        b.parentGroup.getWorldPosition(_orbWorld);

        const dir = _camWorld.clone().sub(_orbWorld).normalize();
        _targetWorld.copy(_orbWorld).add(dir.multiplyScalar(b.radius + 0.06));

        const localTarget = b.parentGroup.worldToLocal(_targetWorld.clone());
        b.sprite.position.copy(localTarget);
        b.sprite.quaternion.copy(camera.quaternion);
      }

      group.rotation.y = Math.sin(t * 0.18) * 0.02;

      controls.update();
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    // ---- cleanup ----
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      controls.dispose();

      group.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            if (m.map) m.map.dispose();
            if (m.emissiveMap) m.emissiveMap.dispose();
            m.dispose();
          });
        }
      });

      renderer.dispose();
      if (renderer.domElement?.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [rootData, viewMode]);

  const toggleView = () => {
    setSelected(null);
    setViewMode((m) => (m === "tree" ? "diagram" : "tree"));
  };

  const isTree = viewMode === "tree";

  const activeLabel =
    (!activeSubtree && "All domains") ||
    apps.find((a) => a.id === activeSubtree)?.label ||
    activeSubtree.replace(/^app:/, "");

  const navOptions = useMemo(() => {
    const base = ["", ...apps.map((a) => a.id)];
    if (!activeSubtree || base.includes(activeSubtree)) return base;
    return [...base, activeSubtree];
  }, [apps, activeSubtree]);

  const activeIndex = useMemo(() => {
    const idx = navOptions.indexOf(activeSubtree);
    return idx === -1 ? 0 : idx;
  }, [navOptions, activeSubtree]);

  const goPrevTree = () => {
    if (navOptions.length <= 1) return;
    const nextIndex = (activeIndex - 1 + navOptions.length) % navOptions.length;
    setActiveSubtree(navOptions[nextIndex]);
  };

  const goNextTree = () => {
    if (navOptions.length <= 1) return;
    const nextIndex = (activeIndex + 1) % navOptions.length;
    setActiveSubtree(navOptions[nextIndex]);
  };

  const arrowDisabled = navOptions.length <= 1;

  return (
    <div className={`w-full h-[calc(100vh-0px)] relative ${isTree ? "bg-black" : "bg-white"}`}>
      {/* 3D mount only in tree mode */}
      {isTree && <div ref={mountRef} className="absolute inset-0" />}

      {/* 2D diagram only in diagram mode */}
      {!isTree && rootData && (
        <TreeOfKnowledgeDiagram2D rootData={rootData} selected={selected} onSelect={setSelected} />
      )}

      {/* Loading / error overlay */}
      {!rootData && !loadErr && (
        <div
          className={`absolute inset-0 grid place-items-center ${
            isTree ? "text-white/80" : "text-black/70"
          }`}
        >
          Loading knowledge tree…
        </div>
      )}
      {loadErr && (
        <div className="absolute inset-0 grid place-items-center text-red-600">
          Failed to load tree: {loadErr}
        </div>
      )}

      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex gap-3 pointer-events-none">
        <div
          className={`pointer-events-auto rounded-xl px-4 py-3 max-w-xl border ${
            isTree
              ? "bg-black/60 text-white border-white/10"
              : "bg-white/90 text-black border-black/10"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold">
              {isTree ? "Tree of Knowledge (3D)" : "Knowledge Diagram (2D)"} · {activeLabel}
            </div>

            <div className="flex items-center gap-2">
              {/* App selector */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous tree"
                  onClick={goPrevTree}
                  disabled={arrowDisabled}
                  className={`text-xs rounded-lg px-2 py-1 border ${
                    isTree
                      ? "bg-white/10 hover:bg-white/20 border-white/10"
                      : "bg-black/5 hover:bg-black/10 border-black/10"
                  } ${arrowDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Next tree"
                  onClick={goNextTree}
                  disabled={arrowDisabled}
                  className={`text-xs rounded-lg px-2 py-1 border ${
                    isTree
                      ? "bg-white/10 hover:bg-white/20 border-white/10"
                      : "bg-black/5 hover:bg-black/10 border-black/10"
                  } ${arrowDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  →
                </button>
              </div>
              <select
                className={`text-xs rounded-lg px-2 py-1 border outline-none ${
                  isTree
                    ? "bg-black/30 border-white/10"
                    : "bg-white border-black/10"
                }`}
                value={activeSubtree}
                onChange={(e) => setActiveSubtree(e.target.value)}
              >
                <option value="">All domains</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={toggleView}
                className={`text-xs rounded-lg px-3 py-1 border ${
                  isTree
                    ? "bg-white/10 hover:bg-white/20 border-white/10"
                    : "bg-black/5 hover:bg-black/10 border-black/10"
                }`}
              >
                {isTree ? "Switch to 2D" : "Switch to 3D"}
              </button>
            </div>
          </div>

          <div className="text-xs opacity-80 mt-1">
            {isTree
              ? "Drag to orbit · Scroll to zoom · Click nodes to inspect"
              : "Drag to pan · Scroll to zoom · Click nodes to inspect"}
          </div>

          <div className="text-[11px] opacity-70 mt-1">
            source: DB · treeKey: {TREE_KEY} · subtree: {activeSubtree}
          </div>
        </div>

        {selected && (
          <div
            className={`pointer-events-auto rounded-xl px-4 py-3 flex-1 border ${
              isTree
                ? "bg-black/60 text-white border-white/10"
                : "bg-white/90 text-black border-black/10"
            }`}
          >
            <div className="font-semibold">{selected.label}</div>
            <div className="text-xs opacity-80 mt-1">id: {selected.id}</div>
            <div className="text-xs opacity-80">type: {selected.type}</div>
            {selected.appId && <div className="text-xs opacity-80">app: {selected.appId}</div>}
            {selected.accepts && (
              <div className="text-xs mt-2">
                accepts: <span className="opacity-90">{selected.accepts.join(", ")}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
