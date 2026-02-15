import { useEffect, useMemo, useRef, useState } from "react";

import { walk, paletteFor } from "./knowledgeTreeModel";
import { layoutRadialTree2D } from "./layoutRadialTree2D";
import { applyNodeRepulsion } from "./repulsion";
import { clamp, edgePath, hexToCss } from "./svgUtils";

function nodeRadius2D(node) {
  if (node.type === "root") return 28;
  if (node.type === "app") return 26;
  if (node.type === "alveolus") return 18;
  return 20;
}

export default function TreeOfKnowledgeDiagram2D({ rootData, selected, onSelect }) {
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const [view, setView] = useState({ tx: 0, ty: 0, scale: 1 });

  const diagram = useMemo(() => {
    const nodes = [];
    const edges = [];
    const parentById = new Map();
    const appIdById = new Map();
    const byId = new Map();
    const depthById = new Map();

    walk(rootData, (node, parent, appId) => {
      nodes.push(node);
      byId.set(node.id, node);
      parentById.set(node.id, parent ?? null);
      appIdById.set(node.id, appId ?? null);
      depthById.set(node.id, (parent ? (depthById.get(parent.id) ?? 0) + 1 : 0));
      if (parent) edges.push({ from: parent.id, to: node.id });
    });

    // 1) deterministic radial placement (give deeper rings more space)
    // If your layoutRadialTree2D only accepts a number for `ring`,
    // it will still work fine: this just makes the initial layout looser by using a larger constant.
    const basePos = layoutRadialTree2D(rootData, {
      ring: 240, // was 190 — bigger first-order separation
      base: 0,
      spiral: 0.18
    });

    // 2) repel nodes so circles + labels don't touch
    const posById = applyNodeRepulsion(basePos, nodes, {
      radiusFor: (node) => {
        const d = depthById.get(node.id) ?? 0;

        const base = nodeRadius2D(node);

        // More spacing for outer depths because their bands get crowded by labels
        const labelPad = 18 + d * 3;

        // Apps get extra “importance halo” space
        const appPad = node.type === "app" ? 14 : 8;

        return base + labelPad + appPad;
      },
      padding: 22, // was 16 — more global breathing room
      strength: 0.85, // slightly stronger
      anchorStrength: 0.10,
      maxStep: 14, // allow larger corrective steps
      iterations: 28 // a few more passes
    });

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    for (const p of posById.values()) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    return {
      nodes,
      edges,
      parentById,
      appIdById,
      depthById,
      byId,
      posById,
      bounds: { minX, maxX, minY, maxY }
    };
  }, [rootData]);

  // Fit to container (center everything)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const pad = 90;
    const fit = () => {
      const w = el.clientWidth || 800;
      const h = el.clientHeight || 600;

      const bw = Math.max(1, diagram.bounds.maxX - diagram.bounds.minX);
      const bh = Math.max(1, diagram.bounds.maxY - diagram.bounds.minY);

      const scale = Math.max(
        0.10,
        Math.min(2.6, Math.min((w - pad * 2) / bw, (h - pad * 2) / bh))
      );

      const cx = (diagram.bounds.minX + diagram.bounds.maxX) / 2;
      const cy = (diagram.bounds.minY + diagram.bounds.maxY) / 2;

      const tx = w / 2 - cx * scale;
      const ty = h / 2 - cy * scale;

      setView({ tx, ty, scale });
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [diagram.bounds]);

  // Pan / zoom
  const dragRef = useRef({ dragging: false, sx: 0, sy: 0, stx: 0, sty: 0 });

  function onPointerDown(e) {
    if (e.target?.dataset?.node === "1") return;
    svgRef.current?.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      dragging: true,
      sx: e.clientX,
      sy: e.clientY,
      stx: view.tx,
      sty: view.ty
    };
  }

  function onPointerMove(e) {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    setView((v) => ({
      ...v,
      tx: dragRef.current.stx + dx,
      ty: dragRef.current.sty + dy
    }));
  }

  function onPointerUp() {
    dragRef.current.dragging = false;
  }

  function onWheel(e) {
    e.preventDefault();
    const el = wrapRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    setView((v) => {
      const zoom = Math.exp(-e.deltaY * 0.0016);
      const nextScale = clamp(v.scale * zoom, 0.08, 4.0);

      const wx = (mx - v.tx) / v.scale;
      const wy = (my - v.ty) / v.scale;

      const tx = mx - wx * nextScale;
      const ty = my - wy * nextScale;

      return { tx, ty, scale: nextScale };
    });
  }

  function handleNodeClick(node) {
    const appId = diagram.appIdById.get(node.id) ?? null;
    onSelect?.({
      id: node.id,
      label: node.label,
      type: node.type,
      accepts: node.accepts || null,
      appId
    });
  }

  return (
    <div ref={wrapRef} className="absolute inset-0 bg-white">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="#000"
              opacity="0.05"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />

        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
          {/* edges */}
          {diagram.edges.map((e) => {
            const a = diagram.posById.get(e.from);
            const b = diagram.posById.get(e.to);
            if (!a || !b) return null;

            const child = diagram.byId.get(e.to);
            const parent = diagram.byId.get(e.from);
            const appId = diagram.appIdById.get(e.to) ?? null;

            const pal = paletteFor(child || parent, appId, parent);
            const stroke = child?.type === "app" ? hexToCss(pal.emissive) : "#666";

            // depth cue: deeper edges slightly lighter
            const d = diagram.depthById.get(e.to) ?? 0;
            const edgeOpacity = Math.max(0.22, 0.55 - d * 0.05);

            return (
              <path
                key={`${e.from}->${e.to}`}
                d={edgePath(a, b, `${e.from}->${e.to}`, 0.22)}
                fill="none"
                stroke={stroke}
                strokeWidth={1.35}
                opacity={child?.type === "app" ? Math.min(0.7, edgeOpacity + 0.12) : edgeOpacity}
                strokeLinecap="round"
              />
            );
          })}

          {/* nodes */}
          {diagram.nodes.map((node) => {
            const p = diagram.posById.get(node.id);
            if (!p) return null;

            const parent = diagram.parentById.get(node.id);
            const appId = diagram.appIdById.get(node.id) ?? null;
            const pal = paletteFor(node, appId, parent);

            const isSelected = selected?.id === node.id;
            const r = nodeRadius2D(node);

            const d = diagram.depthById.get(node.id) ?? 0;

            // depth cues
            const strokeW = isSelected ? 3 : Math.max(1, 2.8 - d * 0.35);
            const labelSize = Math.max(10, 13 - d * 0.7);
            const labelOpacity = Math.max(0.65, 0.98 - d * 0.06);

            return (
              <g
                key={node.id}
                transform={`translate(${p.x} ${p.y})`}
                onClick={() => handleNodeClick(node)}
                style={{ cursor: "pointer" }}
                data-node="1"
              >
                {isSelected && (
                  <circle
                    r={r + 10}
                    fill="none"
                    stroke="#00a88a"
                    strokeWidth={2}
                    opacity={0.25}
                    data-node="1"
                  />
                )}

                <circle
                  r={r}
                  fill={node.type === "app" ? "#f7f7ff" : "#ffffff"}
                  stroke={isSelected ? "#00a88a" : "#222"}
                  strokeWidth={strokeW}
                  data-node="1"
                />

                {node.type === "app" && (
                  <circle
                    r={r + 3.5}
                    fill="none"
                    stroke={hexToCss(pal.emissive)}
                    strokeWidth={2}
                    opacity={0.85}
                    data-node="1"
                  />
                )}

                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={node.type === "root" ? 18 : node.type === "app" ? 16 : 14}
                  fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
                  fill="#111"
                  data-node="1"
                >
                  {node.icon ? node.icon : node.type === "root" ? "🔥" : "•"}
                </text>

                <text
                  textAnchor="middle"
                  dominantBaseline="hanging"
                  y={r + 8}
                  fontSize={labelSize}
                  fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
                  fill="#111"
                  opacity={labelOpacity}
                  data-node="1"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
