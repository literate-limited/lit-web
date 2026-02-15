import { useCallback, useEffect, useRef, useState } from "react";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const formatTick = (n) => {
  if (Math.abs(n) < 1) return n.toFixed(2);
  if (Math.abs(n) < 10) return n.toFixed(1);
  return n.toFixed(0);
};

const MIN_SCALE = 14;
const MAX_SCALE = 520;
const BASE_SCALE = 90;

const GraphCanvas = ({ functions, viewState, setViewState }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dragOriginRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dimensions.width || !dimensions.height) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { scale, offsetX, offsetY } = viewState;
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Background
    const gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height);
    gradient.addColorStop(0, "rgba(19, 34, 70, 0.85)");
    gradient.addColorStop(1, "rgba(6, 12, 30, 0.9)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Grid spacing that adapts to zoom level
    const targetPx = 90;
    const rawStep = targetPx / scale;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;
    let step = magnitude;
    if (residual >= 5) step = 5 * magnitude;
    else if (residual >= 2) step = 2 * magnitude;

    const worldMinX = (-centerX - offsetX) / scale;
    const worldMaxX = (dimensions.width - centerX - offsetX) / scale;
    const worldMinY = (centerY + offsetY - dimensions.height) / scale;
    const worldMaxY = (centerY + offsetY) / scale;

    const toScreen = (x, y) => ({
      x: centerX + offsetX + x * scale,
      y: centerY + offsetY - y * scale,
    });

    // Grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(148,163,184,0.1)";
    ctx.font = "10px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "rgba(148,163,184,0.6)";

    const startX = Math.ceil(worldMinX / step) * step;
    for (let x = startX; x <= worldMaxX; x += step) {
      const { x: sx } = toScreen(x, 0);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, dimensions.height);
      ctx.stroke();
      if (Math.abs(x) > step / 2) {
        ctx.fillText(formatTick(x), sx + 4, centerY + offsetY - 6);
      }
    }

    const startY = Math.ceil(worldMinY / step) * step;
    for (let y = startY; y <= worldMaxY; y += step) {
      const { y: sy } = toScreen(0, y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(dimensions.width, sy);
      ctx.stroke();
      if (Math.abs(y) > step / 2) {
        ctx.fillText(formatTick(y), centerX + offsetX + 6, sy - 4);
      }
    }

    // Axes
    ctx.strokeStyle = "rgba(226,232,240,0.85)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, toScreen(0, 0).y);
    ctx.lineTo(dimensions.width, toScreen(0, 0).y);
    ctx.moveTo(toScreen(0, 0).x, 0);
    ctx.lineTo(toScreen(0, 0).x, dimensions.height);
    ctx.stroke();

    // Functions
    functions
      .filter((fn) => fn.visible && fn.evaluator)
      .forEach((fn) => {
      ctx.beginPath();
      ctx.strokeStyle = fn.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = `${fn.color}80`;
      ctx.shadowBlur = 10;

      let drawing = false;
      const sampleStep = 1.5;
      for (let px = 0; px <= dimensions.width; px += sampleStep) {
        const worldX = (px - centerX - offsetX) / scale;
        let worldY;
        try {
          worldY = fn.evaluator(worldX);
        } catch {
          drawing = false;
          continue;
        }
        if (!Number.isFinite(worldY)) {
          drawing = false;
          continue;
        }
        const py = centerY + offsetY - worldY * scale;
        if (!drawing) {
          ctx.moveTo(px, py);
          drawing = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
  }, [functions, dimensions, viewState]);

  useEffect(() => {
    draw();
  }, [draw]);

  const applyZoom = (prev, nextScale) => {
    if (!dimensions.width || !dimensions.height) {
      return { ...prev, scale: nextScale };
    }
    const worldX = -prev.offsetX / prev.scale;
    const worldY = prev.offsetY / prev.scale;
    const offsetX = -worldX * nextScale;
    const offsetY = worldY * nextScale;
    return { scale: nextScale, offsetX, offsetY };
  };

  const zoomToScale = (nextScale) => {
    const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    setViewState((prev) => applyZoom(prev, clampedScale));
  };

  const zoomByFactor = (factor) => {
    setViewState((prev) => applyZoom(prev, clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE)));
  };

  const handlePointerDown = (event) => {
    dragOriginRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerUp = () => {
    dragOriginRef.current = null;
  };

  const handlePointerMove = (event) => {
    if (!dragOriginRef.current) return;
    setViewState((prev) => {
      const dx = event.clientX - dragOriginRef.current.x;
      const dy = event.clientY - dragOriginRef.current.y;
      dragOriginRef.current = { x: event.clientX, y: event.clientY };
      return { ...prev, offsetX: prev.offsetX + dx, offsetY: prev.offsetY + dy };
    });
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className="mathmadness-grid relative h-full w-full rounded-l-3xl border-l border-slate-800/70 bg-gradient-to-br from-[#0a142c] via-[#0a1a34] to-[#071422]"
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        <div className="pointer-events-none absolute left-6 top-6 rounded-2xl border border-cyan-400/30 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-lg shadow-cyan-500/10 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
            Controls
          </p>
          <p className="mathmadness-mono text-sm text-slate-100">
            Use zoom controls · Drag to pan · Values update live
          </p>
        </div>

        <div className="absolute right-6 top-6 rounded-2xl border border-slate-700/60 bg-slate-950/70 px-4 py-3 text-xs text-slate-100 shadow-lg shadow-slate-900/60 backdrop-blur">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
            Zoom
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => zoomByFactor(0.9)}
              aria-label="Zoom out"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-900 text-slate-200 transition hover:border-cyan-400/60 hover:text-cyan-200"
            >
              -
            </button>
            <input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={2}
              value={Math.round(viewState.scale)}
              onChange={(event) => zoomToScale(Number(event.target.value))}
              aria-label="Zoom level"
              className="h-2 w-32 cursor-pointer accent-cyan-400"
            />
            <button
              type="button"
              onClick={() => zoomByFactor(1.1)}
              aria-label="Zoom in"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-900 text-slate-200 transition hover:border-cyan-400/60 hover:text-cyan-200"
            >
              +
            </button>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            {Math.round((viewState.scale / BASE_SCALE) * 100)}% scale
          </p>
        </div>

        <div className="pointer-events-none absolute bottom-6 right-6 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-100 backdrop-blur">
          Math-Madness · Lit🔥 Functions
        </div>
      </div>
    </div>
  );
};

export default GraphCanvas;
