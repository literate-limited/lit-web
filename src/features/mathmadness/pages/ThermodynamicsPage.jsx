import { useMemo, useState } from "react";
import { FiThermometer, FiWind } from "react-icons/fi";
import { TbFlame, TbGauge } from "react-icons/tb";
import ThermoCycleVisualizer from "../components/ThermoCycleVisualizer";

const laws = [
  {
    title: "Zeroth law",
    expression: "Equilibrium is transitive",
    description: "If A is in thermal equilibrium with B and B with C, all share the same temperature.",
  },
  {
    title: "First law",
    expression: "Energy is conserved",
    description: "Heat added becomes internal energy or work; track both to close the balance.",
  },
  {
    title: "Second law",
    expression: "Entropy never decreases",
    description: "Real cycles waste some availability; irreversibility eats into Carnot efficiency.",
  },
  {
    title: "Third law",
    expression: "Absolute zero is unreachable",
    description: "Entropy approaches a floor as T heads toward 0 K; cold sinks still have cost.",
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
  <label className="block rounded-xl border border-amber-900/70 bg-[#1c110c]/70 px-4 py-3 shadow-inner shadow-amber-900/20">
    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-amber-300/80">
      <span>{label}</span>
      <span className="text-sm font-semibold text-amber-50 tracking-normal">
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
      className="mt-3 h-2 w-full cursor-pointer accent-amber-400"
      style={{ accentColor: accent }}
      aria-label={label}
    />
    <p className="mt-2 text-xs text-amber-200/80">{description}</p>
  </label>
);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const ThermodynamicsPage = () => {
  const [controls, setControls] = useState({
    hotTemp: 850,
    coldTemp: 320,
    volume: 1.1,
    moles: 1.3,
    irreversibility: 0.08,
  });

  const derived = useMemo(() => {
    const hot = Math.max(controls.hotTemp, controls.coldTemp + 30);
    const cold = Math.min(controls.coldTemp, hot - 5);
    const volume = Math.max(0.6, controls.volume);
    const moles = Math.max(0.4, controls.moles);
    const irreversibility = clamp(controls.irreversibility, 0, 0.35);
    const R = 8.314; // kPa*L/(mol*K)

    const carnotEff = Math.max(0, 1 - cold / hot);
    const effLoss = 1 - irreversibility * 0.3;
    const efficiency = clamp(carnotEff * effLoss, 0.02, 0.9);

    const heatAdded = Math.max(220, (hot - cold) * 0.55 * moles + 200);
    const workOut = heatAdded * efficiency;

    const pressureHot = (moles * R * hot) / volume;
    const pressureCold = (moles * R * cold) / (volume * (1 + irreversibility * 0.18));

    const entropyBalance =
      heatAdded / hot - (heatAdded - workOut) / cold + irreversibility * 0.02;

    const cycleVolume = volume * (1 - irreversibility * 0.1);

    return {
      hot,
      cold,
      volume: cycleVolume,
      moles,
      irreversibility,
      efficiency,
      heatAdded,
      workOut,
      entropyBalance,
      pressureHot,
      pressureCold,
    };
  }, [controls]);

  const updateControl = (key) => (value) =>
    setControls((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[720px] flex-col gap-4 overflow-hidden rounded-l-3xl xl:flex-row">
      <div className="w-full max-w-xl shrink-0 space-y-5 border-b border-amber-900/70 bg-[#120b08]/85 px-6 py-6 backdrop-blur-xl xl:h-full xl:border-b-0 xl:border-r">
        <div className="flex items-center gap-3 text-amber-50">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/25 via-orange-400/25 to-emerald-300/25 text-amber-200 shadow-inner shadow-amber-900/20 ring-1 ring-amber-500/30">
            <TbFlame size={20} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-amber-300/90">
              Lit Heat Lab
            </p>
            <p className="text-lg font-semibold">Thermodynamics Cycle</p>
          </div>
        </div>
        <p className="text-sm text-amber-100/90">
          Push a working fluid through a four-step loop, dial reservoir temperatures, and feel how
          irreversibility drags Carnot&apos;s limit. The p-v area glows with the work you harvest.
        </p>

        <div className="grid gap-3">
          {laws.map((law) => (
            <div
              key={law.title}
              className="rounded-2xl border border-amber-900/80 bg-[#1b110c]/70 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-amber-50">{law.title}</p>
                <span className="rounded-full bg-amber-900/70 px-3 py-1 text-[11px] text-amber-200 ring-1 ring-amber-700/50">
                  {law.expression}
                </span>
              </div>
              <p className="mt-2 text-xs text-amber-200/80">{law.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-amber-900/80 bg-[#1a100c]/70 p-4 shadow-inner shadow-amber-900/20">
          <div className="flex items-center justify-between text-sm font-semibold text-amber-50">
            <span className="flex items-center gap-2">
              <TbGauge className="text-amber-300" />
              Cycle readouts
            </span>
            <span className="text-[11px] uppercase tracking-[0.3em] text-amber-300/80">
              Live
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-amber-100">
            <div className="rounded-xl bg-[#23130d]/70 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300/70">Efficiency</p>
              <p className="text-lg font-semibold">{Math.round(derived.efficiency * 100)}%</p>
              <p className="text-[11px] text-amber-200/70">Carnot trimmed by losses</p>
            </div>
            <div className="rounded-xl bg-[#23130d]/70 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300/70">Work out</p>
              <p className="text-lg font-semibold">{derived.workOut.toFixed(1)} kJ</p>
              <p className="text-[11px] text-amber-200/70">Area under the loop</p>
            </div>
            <div className="rounded-xl bg-[#23130d]/70 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300/70">Heat in</p>
              <p className="text-lg font-semibold">{derived.heatAdded.toFixed(0)} kJ</p>
              <p className="text-[11px] text-amber-200/70">Supplied from hot bath</p>
            </div>
            <div className="rounded-xl bg-[#23130d]/70 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300/70">Entropy</p>
              <p className="text-lg font-semibold">{derived.entropyBalance.toFixed(3)} kJ/K</p>
              <p className="text-[11px] text-amber-200/70">Net balance over the loop</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex-1 px-4 py-4">
        <div className="flex h-full flex-col gap-4">
          <div className="flex-1 min-h-[360px]">
            <ThermoCycleVisualizer
              hotTemp={derived.hot}
              coldTemp={derived.cold}
              volume={derived.volume}
              moles={derived.moles}
              irreversibility={derived.irreversibility}
              heatAdded={derived.heatAdded}
              workOut={derived.workOut}
              efficiency={derived.efficiency}
              entropyBalance={derived.entropyBalance}
              pressureHot={derived.pressureHot}
              pressureCold={derived.pressureCold}
            />
          </div>

          <div className="rounded-2xl border border-amber-900/80 bg-[#1a110c]/70 px-4 py-4 shadow-inner shadow-amber-900/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-50">
                <TbFlame className="text-amber-300" />
                Reservoir controls
              </div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-amber-300/80">
                <FiWind className="text-amber-200" />
                Heat engine
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <ControlSlider
                label="Hot reservoir"
                value={controls.hotTemp}
                min={520}
                max={1200}
                step={10}
                unit="K"
                accent="#f59e0b"
                description="Raise the hot bath temperature; Carnot tops out at Th-Tc."
                formatValue={(v) => Math.round(v)}
                onChange={updateControl("hotTemp")}
              />
              <ControlSlider
                label="Cold sink"
                value={controls.coldTemp}
                min={250}
                max={520}
                step={10}
                unit="K"
                accent="#22d3ee"
                description="Lower the cold bath to open the window for useful work."
                formatValue={(v) => Math.round(v)}
                onChange={updateControl("coldTemp")}
              />
              <ControlSlider
                label="Moles of working fluid"
                value={controls.moles}
                min={0.4}
                max={2.5}
                step={0.05}
                unit="mol"
                accent="#fbbf24"
                description="More gas lifts both pressure and capacity for work."
                formatValue={(v) => v.toFixed(2)}
                onChange={updateControl("moles")}
              />
              <ControlSlider
                label="Volume at start"
                value={controls.volume}
                min={0.6}
                max={2.4}
                step={0.05}
                unit="L"
                accent="#34d399"
                description="Sets the left edge of the p-v loop; expansion scales from here."
                formatValue={(v) => v.toFixed(2)}
                onChange={updateControl("volume")}
              />
              <ControlSlider
                label="Irreversibility"
                value={controls.irreversibility}
                min={0}
                max={0.35}
                step={0.01}
                unit="loss"
                accent="#fb923c"
                description="Captures friction, leaks, and finite gradients; trims ideal eta."
                formatValue={(v) => v.toFixed(2)}
                onChange={updateControl("irreversibility")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermodynamicsPage;
