import { useMemo } from "react";

const ThermoCycleVisualizer = ({
  hotTemp,
  coldTemp,
  volume,
  moles,
  irreversibility,
  heatAdded,
  workOut,
  efficiency,
  entropyBalance,
  pressureHot,
  pressureCold,
}) => {
  const viewBoxWidth = 960;
  const viewBoxHeight = 520;
  const margin = 70;

  const { pathD, cyclePoints, labels, isoCurves, gridLines } = useMemo(() => {
    const R = 8.314; // kPa*L/(mol*K)
    const baseV = Math.max(volume, 0.6);
    const spread = Math.max(hotTemp - coldTemp, 40);
    const expansion = 1.18 + (spread / 1000) * 0.65;
    const slack = 0.06 + irreversibility * 0.4;

    const V1 = baseV;
    const V2 = baseV * expansion;
    const V3 = baseV * (expansion * 1.06 + slack);
    const V4 = baseV * (0.88 + slack * 0.6);

    const calcPressure = (temp, v) => (moles * R * temp) / v;

    const P1 = calcPressure(hotTemp, V1);
    const P2 = calcPressure(hotTemp, V2);
    const P3 = calcPressure(coldTemp, V3);
    const P4 = calcPressure(coldTemp, V4);

    const volumes = [V1, V2, V3, V4];
    const pressures = [P1, P2, P3, P4];
    const maxV = Math.max(...volumes) * 1.08;
    const minV = Math.max(Math.min(...volumes) * 0.9, 0.4);
    const maxP = Math.max(...pressures) * 1.1;
    const minP = Math.max(Math.min(...pressures) * 0.82, 10);

    const project = (v, p) => {
      const x =
        margin + ((v - minV) / (maxV - minV)) * (viewBoxWidth - margin * 2);
      const y =
        viewBoxHeight -
        margin -
        ((p - minP) / (maxP - minP)) * (viewBoxHeight - margin * 2);
      return { x, y };
    };

    const cyclePoints = [
      project(V1, P1),
      project(V2, P2),
      project(V3, P3),
      project(V4, P4),
    ];
    const labels = ["A", "B", "C", "D"];

    const pathD =
      cyclePoints
        .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
        .join(" ") + " Z";

    const buildIso = (temp, softness = 0) => {
      const steps = 42;
      const softnessScale = 1 + softness;
      let d = "";
      for (let i = 0; i <= steps; i += 1) {
        const ratio = i / steps;
        const v = minV + ratio * (maxV - minV);
        const p = calcPressure(temp, v) / softnessScale;
        const pt = project(v, p);
        d += `${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} `;
      }
      return d.trim();
    };

    const isoCurves = [
      { d: buildIso(hotTemp, 0), color: "rgba(255,179,71,0.45)" },
      { d: buildIso((hotTemp + coldTemp) / 2, 0.12), color: "rgba(255,152,120,0.35)" },
      { d: buildIso(coldTemp, 0.2), color: "rgba(94,234,212,0.35)" },
    ];

    const vertical = Array.from({ length: 5 }, (_, i) => {
      const v = minV + (i / 4) * (maxV - minV);
      return project(v, minP).x;
    });
    const horizontal = Array.from({ length: 5 }, (_, i) => {
      const p = minP + (i / 4) * (maxP - minP);
      return project(minV, p).y;
    });

    return { pathD, cyclePoints, labels, isoCurves, gridLines: { vertical, horizontal } };
  }, [hotTemp, coldTemp, volume, moles, irreversibility, margin, viewBoxWidth, viewBoxHeight]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-amber-900/60 bg-gradient-to-br from-[#0e0a07] via-[#17100e] to-[#0d0b15] shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
      <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="h-full w-full">
        <defs>
          <linearGradient id="thermo-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,200,120,0.18)" />
            <stop offset="45%" stopColor="rgba(255,130,90,0.18)" />
            <stop offset="100%" stopColor="rgba(94,234,212,0.12)" />
          </linearGradient>
          <linearGradient id="thermo-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <radialGradient id="thermo-flare" cx="30%" cy="20%" r="70%">
            <stop offset="0%" stopColor="rgba(255,214,102,0.28)" />
            <stop offset="60%" stopColor="rgba(255,138,76,0.08)" />
            <stop offset="100%" stopColor="rgba(20,10,6,0)" />
          </radialGradient>
        </defs>

        <rect width={viewBoxWidth} height={viewBoxHeight} fill="url(#thermo-flare)" />

        <g stroke="rgba(248,180,98,0.12)" strokeWidth="1.2">
          {gridLines.vertical.map((x, idx) => (
            <line key={`v-${idx}`} x1={x} x2={x} y1={margin * 0.7} y2={viewBoxHeight - margin * 0.6} />
          ))}
          {gridLines.horizontal.map((y, idx) => (
            <line key={`h-${idx}`} x1={margin * 0.8} x2={viewBoxWidth - margin * 0.6} y1={y} y2={y} />
          ))}
        </g>

        {isoCurves.map((curve, idx) => (
          <path
            key={`iso-${idx}`}
            d={curve.d}
            fill="none"
            stroke={curve.color}
            strokeWidth={idx === 0 ? 2.4 : 1.4}
            strokeDasharray={idx === 0 ? "10 4" : "6 5"}
          />
        ))}

        <path
          d={pathD}
          fill="url(#thermo-fill)"
          stroke="url(#thermo-stroke)"
          strokeWidth="3.2"
          strokeLinejoin="round"
          className="drop-shadow-[0_10px_50px_rgba(249,115,22,0.25)]"
        />

        {cyclePoints.map((pt, idx) => (
          <g key={`pt-${labels[idx]}`} transform={`translate(${pt.x}, ${pt.y})`}>
            <circle r={8.5} fill="#0b0907" stroke="#f59e0b" strokeWidth="2" />
            <circle r={4} fill="#22d3ee" />
            <text
              x={0}
              y={-14}
              textAnchor="middle"
              className="mathmadness-mono"
              fill="#f8fafc"
              fontSize="11"
            >
              {labels[idx]}
            </text>
          </g>
        ))}

        <text
          x={margin * 0.8}
          y={margin * 0.7 - 10}
          fill="rgba(248,180,98,0.8)"
          className="mathmadness-mono"
          fontSize="12"
        >
          Pressure (kPa)
        </text>
        <text
          x={viewBoxWidth - margin}
          y={viewBoxHeight - margin * 0.25}
          fill="rgba(248,180,98,0.8)"
          textAnchor="end"
          className="mathmadness-mono"
          fontSize="12"
        >
          Volume (L)
        </text>
      </svg>

      <div className="pointer-events-none absolute left-4 top-4 flex max-w-lg flex-col gap-2 rounded-2xl border border-amber-800/60 bg-[#1b100a]/80 px-4 py-3 text-xs text-amber-100 shadow-lg shadow-amber-900/30 backdrop-blur">
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/80">Cycle primer</p>
        <p className="mathmadness-mono text-sm text-amber-50">
          Hot reservoir drives the isothermal rise (A-&gt;B), expansion leaks to the cold sink (B-&gt;C), and compression returns the working fluid (C-&gt;D-&gt;A).
        </p>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 flex flex-wrap gap-2 text-[11px] text-amber-100">
        <span className="flex items-center gap-2 rounded-full bg-[#1f120d]/80 px-3 py-1 shadow-inner shadow-amber-900/40 ring-1 ring-amber-700/50">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          {Math.round(hotTemp)} K hot
        </span>
        <span className="flex items-center gap-2 rounded-full bg-[#0f1a1c]/80 px-3 py-1 shadow-inner shadow-cyan-900/40 ring-1 ring-cyan-800/50">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
          {Math.round(coldTemp)} K cold
        </span>
      </div>

      <div className="pointer-events-none absolute right-4 bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-800/50 bg-[#110b09]/85 px-4 py-3 text-[11px] text-amber-50 shadow-lg shadow-amber-900/30 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          eta {Math.round(efficiency * 100)}%
        </div>
        <div className="flex items-center gap-2 text-cyan-100">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
          W ~ {workOut.toFixed(1)} kJ
        </div>
        <div className="flex items-center gap-2 text-amber-200/80">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Qh {heatAdded.toFixed(0)} kJ
        </div>
        <div className="flex items-center gap-2 text-emerald-200/80">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          Delta S {entropyBalance.toFixed(3)} kJ/K
        </div>
      </div>

      <div className="pointer-events-none absolute left-4 bottom-4 flex flex-col gap-1 rounded-xl bg-[#0c1417]/80 px-3 py-2 text-[11px] text-slate-100 ring-1 ring-cyan-700/40 backdrop-blur">
        <span className="mathmadness-mono text-xs text-cyan-100">
          Ph: {Math.round(pressureHot)} kPa / Pc: {Math.round(pressureCold)} kPa
        </span>
        <span className="text-[10px] uppercase tracking-[0.25em] text-cyan-200/70">
          p-v trace (area ~ work)
        </span>
      </div>
    </div>
  );
};

export default ThermoCycleVisualizer;
