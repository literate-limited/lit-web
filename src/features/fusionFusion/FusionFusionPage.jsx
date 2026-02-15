import { useEffect, useMemo, useReducer } from "react";
import { PRESETS, LESSONS, LAWSON_TARGET, MAX_TEMP_KEV, MIN_TEMP_KEV } from "./data/constants";
import { fusionReducer, initialState } from "./state/fusionReducer";
import { evaluateScenario } from "./utils/calculations";

const Gauge = ({ label, value, suffix = "", highlight = false }) => (
  <div className={`rounded-xl border ${highlight ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"} p-3`}>
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-xl font-semibold text-slate-900">
      {value} {suffix}
    </p>
  </div>
);

const ProgressBar = ({ value, color = "bg-emerald-500", label }) => (
  <div>
    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
      <span>{label}</span>
      <span>{Math.round(value * 100)}%</span>
    </div>
    <div className="h-2 rounded-full bg-slate-100">
      <div
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  </div>
);

const Control = ({ label, min, max, step, value, onChange, suffix }) => (
  <label className="block text-sm text-slate-800 mb-3">
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="text-xs text-slate-500">
        {value} {suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-emerald-600"
    />
  </label>
);

const ModeTabs = ({ mode, onChange }) => (
  <div className="inline-flex rounded-full bg-slate-100 p-1 text-sm">
    {["tokamak", "icf"].map((m) => (
      <button
        key={m}
        type="button"
        onClick={() => onChange(m)}
        className={`px-3 py-1 rounded-full transition ${
          mode === m ? "bg-white shadow text-slate-900" : "text-slate-600"
        }`}
      >
        {PRESETS[m].label}
      </button>
    ))}
  </div>
);

const LessonCard = ({ lesson, onPrev, onNext, index, total }) => (
  <div className="border border-slate-200 rounded-xl bg-white p-4 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase text-slate-500">Lesson {index + 1} / {total}</p>
      <div className="space-x-2">
        <button
          type="button"
          onClick={onPrev}
          className="text-xs px-3 py-1 rounded-lg border border-slate-200 text-slate-700"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={onNext}
          className="text-xs px-3 py-1 rounded-lg bg-slate-900 text-white"
        >
          Next
        </button>
      </div>
    </div>
    <h4 className="text-lg font-semibold text-slate-900">{lesson.title}</h4>
    <p className="text-sm text-slate-700 leading-relaxed">{lesson.body}</p>
  </div>
);

const FusionFusionPage = () => {
  const [state, dispatch] = useReducer(fusionReducer, initialState);

  const analysis = useMemo(() => evaluateScenario(state), [state]);

  useEffect(() => {
    dispatch({ type: "RUN" });
  }, [
    state.temperatureKeV,
    state.density,
    state.confinementTime,
    state.plasmaVolume,
    state.heatingPowerMW,
    state.wallEfficiency,
    state.recircFraction,
    state.radLossFrac,
    state.fuel,
  ]);

  const lesson = LESSONS[Math.min(LESSONS.length - 1, Math.max(0, state.lessonIndex))];

  return (
    <div className="max-w-6xl mx-auto px-5 py-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-600">Simulation</p>
          <h1 className="text-3xl font-bold text-slate-900">Fusion Fusion</h1>
          <p className="text-sm text-slate-700 max-w-3xl mt-2">
            Explore why fusion is hard. Tweak core temperature, density, and confinement to chase
            breakeven. This is an educational model—not a reactor design tool.
          </p>
          <div className="mt-3">
            <ModeTabs
              mode={state.mode}
              onChange={(m) => dispatch({ type: "SET_MODE", mode: m })}
            />
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="font-semibold text-amber-800">Safety / Accuracy</p>
          <p>Educational only. Constants simplified; values approximate.</p>
          <p>Inputs clamped; no external data calls.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Gauge
          label="Q_plasma"
          value={analysis.qPlasma.toFixed(2)}
          highlight={analysis.qPlasma >= 1}
        />
        <Gauge
          label="Q_engineering"
          value={analysis.qEng.toFixed(2)}
          highlight={analysis.qEng >= 1}
        />
        <Gauge
          label="Net electric (MW)"
          value={(analysis.netElectric / 1e6).toFixed(2)}
          highlight={analysis.netElectric > 0}
        />
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 border border-slate-200 rounded-2xl bg-white p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Controls</h3>
            <span className="text-xs text-slate-500">Mode presets: {PRESETS[state.mode].label}</span>
          </div>
          <Control
            label="Temperature (keV)"
            min={MIN_TEMP_KEV}
            max={MAX_TEMP_KEV}
            step={0.5}
            value={state.temperatureKeV}
            suffix="keV"
            onChange={(v) => dispatch({ type: "SET_FIELD", field: "temperatureKeV", value: v })}
          />
          <Control
            label="Density (m⁻³)"
            min={state.mode === "icf" ? 1e24 : 1e19}
            max={state.mode === "icf" ? 1e27 : 5e21}
            step={state.mode === "icf" ? 1e23 : 5e19}
            value={state.density}
            onChange={(v) => dispatch({ type: "SET_FIELD", field: "density", value: v })}
          />
          <Control
            label="Confinement time (s)"
            min={state.mode === "icf" ? 1e-9 : 0.1}
            max={state.mode === "icf" ? 1e-6 : 10}
            step={state.mode === "icf" ? 1e-9 : 0.1}
            value={state.confinementTime}
            onChange={(v) => dispatch({ type: "SET_FIELD", field: "confinementTime", value: v })}
          />
          <Control
            label="Plasma volume (m³)"
            min={state.mode === "icf" ? 1e-4 : 20}
            max={state.mode === "icf" ? 0.01 : 200}
            step={state.mode === "icf" ? 1e-4 : 5}
            value={state.plasmaVolume}
            onChange={(v) => dispatch({ type: "SET_FIELD", field: "plasmaVolume", value: v })}
          />
          <Control
            label="Heating power (MW)"
            min={5}
            max={400}
            step={5}
            value={state.heatingPowerMW}
            onChange={(v) => dispatch({ type: "SET_FIELD", field: "heatingPowerMW", value: v })}
          />
          <Control
            label="Wall / blanket efficiency"
            min={0.1}
            max={0.6}
            step={0.01}
            value={state.wallEfficiency}
            onChange={(v) => dispatch({ type: "SET_FIELD", field: "wallEfficiency", value: v })}
          />
          <Control
            label="Recirculating fraction"
            min={0}
            max={0.4}
            step={0.01}
            value={state.recircFraction}
            onChange={(v) => dispatch({ type: "SET_FIELD", field: "recircFraction", value: v })}
          />
          <Control
            label="Radiation loss fraction"
            min={0.05}
            max={0.4}
            step={0.01}
            value={state.radLossFrac}
            onChange={(v) => dispatch({ type: "SET_FIELD", field: "radLossFrac", value: v })}
          />
        </div>

        <div className="md:col-span-2 border border-slate-200 rounded-2xl bg-white p-4 space-y-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Milestones</h3>
          <ProgressBar label="Lawson triple product" value={analysis.lawsonProgress} />
          <ProgressBar label="Breakeven (Q_plasma ≥ 1)" value={Math.min(1, analysis.qPlasma / 1)} />
          <ProgressBar
            label="Net electric (Q_eng ≥ 1)"
            value={Math.min(1, analysis.qEng / 1)}
            color="bg-indigo-500"
          />
          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
            Triple product: {analysis.triple.toExponential(2)} keV·s·m⁻³ (target {LAWSON_TARGET.toExponential(1)})
            <br />
            Fusion power: {(analysis.pfus / 1e6).toFixed(2)} MW | Radiation losses: {(analysis.prad / 1e6).toFixed(2)} MW
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 border border-slate-200 rounded-2xl bg-white p-4 shadow-sm space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">Power balance snapshot</h3>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
            <div className="border border-slate-100 rounded-xl p-3 bg-slate-50">
              <p className="text-xs uppercase text-slate-500 mb-1">Inputs</p>
              <p>Heating: {(state.heatingPowerMW).toFixed(1)} MW</p>
              <p>Recirc est.: {(analysis.recirc / 1e6).toFixed(2)} MW</p>
            </div>
            <div className="border border-slate-100 rounded-xl p-3 bg-emerald-50">
              <p className="text-xs uppercase text-emerald-700 mb-1">Outputs</p>
              <p>Fusion (thermal): {(analysis.pfus / 1e6).toFixed(2)} MW</p>
              <p>Net electric est.: {(analysis.netElectric / 1e6).toFixed(2)} MW</p>
            </div>
          </div>
          <div className="text-xs text-slate-600">
            Simplified model: Pfus ≈ n² ⟨σv⟩ E * V (assuming equimolar D/T). Losses approximated via radiation fraction and recirculating power. Wall/blanket efficiency reduces thermal → electric.
          </div>
        </div>

        <LessonCard
          lesson={lesson}
          index={state.lessonIndex}
          total={LESSONS.length}
          onPrev={() => dispatch({ type: "PREV_LESSON" })}
          onNext={() => dispatch({ type: "NEXT_LESSON" })}
        />
      </div>
    </div>
  );
};

export default FusionFusionPage;
