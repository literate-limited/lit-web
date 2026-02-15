import { useEffect, useRef } from "react";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const MaxwellVisualizer = ({ frequency, amplitude, phase, speed, polarization }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const controlsRef = useRef({ frequency, amplitude, phase, speed, polarization });
  const sizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    controlsRef.current = { frequency, amplitude, phase, speed, polarization };
  }, [frequency, amplitude, phase, speed, polarization]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      sizeRef.current = { width: rect.width, height: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(containerRef.current);

    let frameId;
    const render = (timestamp) => {
      drawFrame(ctx, timestamp);
      frameId = requestAnimationFrame(render);
    };
    frameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
    };
  }, []);

  const drawFrame = (ctx, timestamp) => {
    const { width, height } = sizeRef.current;
    if (!width || !height) return;

    const { frequency: f, amplitude: a, phase: p, speed: s, polarization: pol } =
      controlsRef.current;
    const t = timestamp * 0.001;

    const freqNorm = clamp((f - 380) / (750 - 380), 0, 1);
    const cycles = 1.4 + freqNorm * 5.2;
    const k = (Math.PI * 2 * cycles) / width;
    const omega = (2.4 + freqNorm * 3) * s;
    const amplitudePx = Math.min(height * 0.22, 140) * a;
    const phaseRad = (p * Math.PI) / 180;
    const polRad = (pol * Math.PI) / 180;
    const centerY = height / 2;
    const split = Math.min(54 + freqNorm * 6, height * 0.18);

    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, "rgba(6,12,26,0.95)");
    bg.addColorStop(0.5, "rgba(7,16,35,0.9)");
    bg.addColorStop(1, "rgba(4,10,24,0.95)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Beam band
    const band = ctx.createLinearGradient(0, centerY, width, centerY);
    band.addColorStop(0, "rgba(34,211,238,0.06)");
    band.addColorStop(0.5, "rgba(14,165,233,0.18)");
    band.addColorStop(1, "rgba(168,85,247,0.12)");
    ctx.fillStyle = band;
    ctx.fillRect(
      0,
      centerY - amplitudePx - split - 16,
      width,
      amplitudePx * 2 + split * 2 + 32
    );

    // Grid overlays
    ctx.strokeStyle = "rgba(148,163,184,0.07)";
    ctx.lineWidth = 1;
    const gridStep = Math.max(48, width / 14);
    for (let x = -gridStep; x < width + gridStep; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = -gridStep; y < height + gridStep; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Axes guides
    ctx.strokeStyle = "rgba(226,232,240,0.18)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, centerY - split);
    ctx.lineTo(width, centerY - split);
    ctx.moveTo(0, centerY + split);
    ctx.lineTo(width, centerY + split);
    ctx.stroke();

    const drawWave = ({
      baseY,
      amplitude,
      color,
      glow,
      phaseOffset = 0,
      thickness = 3,
      usePolarization = false,
    }) => {
      ctx.beginPath();
      ctx.lineWidth = thickness;
      ctx.strokeStyle = color;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 14;
      const step = Math.max(2, Math.floor(width / 260));
      for (let x = 0; x <= width + step; x += step) {
        const phase = k * x - omega * t + phaseOffset;
        const projection = usePolarization
          ? Math.sin(phase) * Math.cos(polRad)
          : Math.sin(phase);
        const y = baseY - projection * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // Electric field (E)
    drawWave({
      baseY: centerY - split,
      amplitude: amplitudePx,
      color: "rgba(94,234,212,0.95)",
      glow: "rgba(94,234,212,0.4)",
      thickness: 3.2,
      usePolarization: true,
    });

    // Polarization halo (orthogonal component hint)
    ctx.beginPath();
    ctx.strokeStyle = "rgba(34,211,238,0.25)";
    ctx.lineWidth = 1.3;
    const polStep = Math.max(3, Math.floor(width / 200));
    for (let x = 0; x <= width + polStep; x += polStep) {
      const phase = k * x - omega * t + polRad;
      const y = centerY - split - Math.sin(phase) * amplitudePx * Math.sin(polRad) * 0.45;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Magnetic field (B)
    drawWave({
      baseY: centerY + split,
      amplitude: amplitudePx * 0.55,
      color: "rgba(129,140,248,0.9)",
      glow: "rgba(129,140,248,0.45)",
      phaseOffset: phaseRad,
      thickness: 2.6,
    });

    // Light pulse traveling with the wavefront
    const pulseX = ((t * 120 * s) % width + width) % width;
    const pulsePhase = k * pulseX - omega * t;
    const pulseY =
      centerY -
      split -
      Math.sin(pulsePhase) * amplitudePx * Math.cos(polRad) * 0.9;
    const pulseRadius = 8 + a * 4 + freqNorm * 2;
    const pulseGlow = ctx.createRadialGradient(
      pulseX,
      pulseY,
      0,
      pulseX,
      pulseY,
      pulseRadius * 3
    );
    pulseGlow.addColorStop(0, "rgba(255,255,255,0.9)");
    pulseGlow.addColorStop(0.35, "rgba(94,234,212,0.85)");
    pulseGlow.addColorStop(1, "rgba(94,234,212,0)");
    ctx.fillStyle = pulseGlow;
    ctx.beginPath();
    ctx.arc(pulseX, pulseY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Phase offset indicator along B baseline
    const markerCount = 18;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < markerCount; i += 1) {
      const x = (i / markerCount) * width;
      const phase = k * x - omega * t + phaseRad;
      const y = centerY + split - Math.sin(phase) * amplitudePx * 0.55;
      ctx.strokeStyle = "rgba(129,140,248,0.5)";
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x, y + 6);
      ctx.stroke();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-3xl border border-slate-800/70 bg-[#050c1a] shadow-[0_25px_70px_rgba(0,0,0,0.35)]"
    >
      <canvas ref={canvasRef} className="h-full w-full" />

      <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-cyan-400/30 bg-slate-900/70 px-4 py-3 text-xs text-slate-100 shadow-lg shadow-cyan-500/10 backdrop-blur">
        <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-200">
          Propagating wave
        </p>
        <p className="mathmadness-mono text-sm text-slate-100">
          E ⟂ B ⟂ direction · sliders drive the beam live
        </p>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 flex flex-wrap gap-3 text-[11px] text-slate-200">
        <span className="flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 shadow-inner shadow-cyan-500/10 ring-1 ring-cyan-400/30">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
          E field
        </span>
        <span className="flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 shadow-inner shadow-indigo-500/10 ring-1 ring-indigo-400/30">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-300" />
          B field
        </span>
        <span className="flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 shadow-inner shadow-amber-500/10 ring-1 ring-amber-400/30">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          Phase &amp; polarization cues
        </span>
      </div>
    </div>
  );
};

export default MaxwellVisualizer;
