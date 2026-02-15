import { useMemo, useState } from "react";
import { FiZap, FiWind } from "react-icons/fi";
import { TbMathFunction, TbActivityHeartbeat } from "react-icons/tb";
import MaxwellVisualizer from "../components/MaxwellVisualizer";

const equations = [
  {
    title: "Gauss (electric)",
    expression: "∇ · E = ρ / ε₀",
    description: "Charge sources electric flux; sliders sculpt its amplitude.",
  },
  {
    title: "Gauss (magnetic)",
    expression: "∇ · B = 0",
    description: "No magnetic monopoles, so B field lines loop and stay divergence-free.",
  },
  {
    title: "Faraday induction",
    expression: "∇ × E = -∂B/∂t",
    description: "A changing B twists E; nudging phase shows the handoff.",
  },
  {
    title: "Ampère–Maxwell",
    expression: "∇ × B = μ₀J + μ₀ε₀ ∂E/∂t",
    description: "Currents and changing E curl B, making the traveling beam possible.",
  },
];

const ControlSlider = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  accent,
  description,
  formatValue = (v) => v,
  onChange,
}) => (
  <label className="block rounded-xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 shadow-inner shadow-cyan-500/10">
    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-slate-400">
      <span>{label}</span>
      <span className="text-sm font-semibold text-slate-100 tracking-normal">
        {formatValue(value)} {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="mt-3 h-2 w-full cursor-pointer accent-cyan-400"
      style={{ accentColor: accent }}
      aria-label={label}
    />
    <p className="mt-2 text-xs text-slate-500">{description}</p>
  </label>
);

const MaxwellEquationsPage = () => {
  const [controls, setControls] = useState({
    frequency: 520, // THz
    amplitude: 1,
    phase: 0,
    speed: 1,
    polarization: 30,
  });

  const metrics = useMemo(() => {
    const wavelengthNm = Math.round((299792.458 / controls.frequency) * 10) / 10;
    const photonEnergyEv = (4.135667696e-3 * controls.frequency).toFixed(2);
    const periodFs = (1000 / controls.frequency).toFixed(2);
    return { wavelengthNm, photonEnergyEv, periodFs };
  }, [controls.frequency]);

  const updateControl = (key) => (value) =>
    setControls((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[720px] flex-col gap-4 overflow-hidden rounded-l-3xl xl:flex-row">
      <div className="w-full max-w-xl shrink-0 space-y-5 border-b border-slate-800/70 bg-[#0d1428]/85 px-6 py-6 backdrop-blur-xl xl:h-full xl:border-b-0 xl:border-r">
        <div className="flex items-center gap-3 text-slate-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-emerald-400/20 to-indigo-500/25 text-cyan-200 shadow-inner shadow-cyan-500/15 ring-1 ring-cyan-400/30">
            <TbMathFunction size={20} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-300/80">
              Lit🔥 Functions
            </p>
            <p className="text-lg font-semibold">Maxwell&apos;s Equations</p>
          </div>
        </div>
        <p className="text-sm text-slate-300">
          Make a light beam obey the four Maxwell laws. Tune the electric field (E), magnetic
          field (B), and their phase relationship; the canvas responds in real time.
        </p>

        <div className="grid gap-3">
          {equations.map((eq) => (
            <div
              key={eq.title}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-50">{eq.title}</p>
                <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] text-cyan-200 ring-1 ring-cyan-400/30">
                  {eq.expression}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">{eq.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-inner shadow-cyan-500/10">
          <div className="flex items-center justify-between text-sm font-semibold text-slate-100">
            <span className="flex items-center gap-2">
              <FiZap className="text-amber-300" />
              Wave readouts
            </span>
            <span className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Live
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-200">
            <div className="rounded-xl bg-slate-800/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Frequency</p>
              <p className="text-lg font-semibold">{Math.round(controls.frequency)} THz</p>
              <p className="text-[11px] text-slate-500">Visible band sweep</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Wavelength</p>
              <p className="text-lg font-semibold">{metrics.wavelengthNm} nm</p>
              <p className="text-[11px] text-slate-500">c / f</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Photon energy</p>
              <p className="text-lg font-semibold">{metrics.photonEnergyEv} eV</p>
              <p className="text-[11px] text-slate-500">h · f</p>
            </div>
            <div className="rounded-xl bg-slate-800/60 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Period</p>
              <p className="text-lg font-semibold">{metrics.periodFs} fs</p>
              <p className="text-[11px] text-slate-500">1 / f</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 px-4 py-4">
        <div className="flex h-full flex-col gap-4">
          <div className="flex-1 min-h-[360px]">
            <MaxwellVisualizer
              frequency={controls.frequency}
              amplitude={controls.amplitude}
              phase={controls.phase}
              speed={controls.speed}
              polarization={controls.polarization}
            />
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-4 shadow-inner shadow-cyan-500/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <TbActivityHeartbeat className="text-emerald-300" />
                Field controls
              </div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
                <FiWind className="text-cyan-300" />
                Light lab
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <ControlSlider
                label="Frequency"
                value={controls.frequency}
                min={380}
                max={750}
                step={5}
                unit="THz"
                accent="#f59e0b"
                description="Slide across the visible spectrum; higher f shortens wavelength."
                formatValue={(v) => Math.round(v)}
                onChange={updateControl("frequency")}
              />
              <ControlSlider
                label="Amplitude"
                value={controls.amplitude}
                min={0.45}
                max={1.5}
                step={0.05}
                unit="E₀"
                accent="#34d399"
                description="Sets E-field magnitude; B scales with it through c."
                formatValue={(v) => v.toFixed(2)}
                onChange={updateControl("amplitude")}
              />
              <ControlSlider
                label="Phase offset (E vs B)"
                value={controls.phase}
                min={0}
                max={180}
                step={5}
                unit="deg"
                accent="#a855f7"
                description="Zero means in-phase; offset shows how curls lead/lag."
                formatValue={(v) => Math.round(v)}
                onChange={updateControl("phase")}
              />
              <ControlSlider
                label="Polarization twist"
                value={controls.polarization}
                min={0}
                max={90}
                step={5}
                unit="deg"
                accent="#ec4899"
                description="0° keeps E linear; 90° approaches circular polarization."
                formatValue={(v) => Math.round(v)}
                onChange={updateControl("polarization")}
              />
              <ControlSlider
                label="Propagation speed"
                value={controls.speed}
                min={0.6}
                max={1.4}
                step={0.05}
                unit="× c"
                accent="#22d3ee"
                description="Scales how fast the wave sweeps; c stays the anchor."
                formatValue={(v) => v.toFixed(2)}
                onChange={updateControl("speed")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaxwellEquationsPage;
