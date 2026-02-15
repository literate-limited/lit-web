import { presets } from "../state/hofState.jsx";

const sliders = [
  { key: "heartRate", label: "Heart Rate (bpm)", min: 40, max: 180, step: 1 },
  { key: "strokeVolume", label: "Stroke Volume (mL)", min: 40, max: 120, step: 1 },
  { key: "respiratoryRate", label: "Respiratory Rate (/min)", min: 8, max: 32, step: 1 },
  { key: "tidalVolume", label: "Tidal Volume (mL)", min: 300, max: 900, step: 10 },
  { key: "inspiredO2", label: "Inspired O₂ (FiO₂)", min: 0.12, max: 1.0, step: 0.01 },
  { key: "hemoglobin", label: "Hemoglobin (g/dL)", min: 6, max: 18, step: 0.1 },
  { key: "membraneThickness", label: "Membrane Thickness (x)", min: 0.5, max: 3, step: 0.1 },
  { key: "vqScatter", label: "V/Q Scatter (fraction)", min: 0, max: 0.8, step: 0.02 },
];

export default function ControlPanel({
  params,
  presetId,
  onChange,
  onPreset,
  onReset,
  colorBlindSafe,
  onColorBlind,
  reducedMotion,
}) {
  return (
    <div className="hof-panel">
      <div className="hof-panel__header">
        <p className="hof-kicker">Hearts on Fire</p>
        <h1 className="hof-title">Controls</h1>
        <p className="hof-muted">Tweak hemodynamics and gas exchange inputs; diffusion does the rest.</p>
      </div>

      <div className="hof-section">
        <p className="hof-section__label">Presets</p>
        <div className="hof-preset-list">
          {presets.map((p) => (
            <button
              key={p.id}
              className={`hof-pill ${presetId === p.id ? "hof-pill--active" : ""}`}
              onClick={() => onPreset(p.id)}
            >
              <div className="hof-pill__title">{p.label}</div>
              <div className="hof-pill__note">{p.note}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="hof-section hof-grid">
        {sliders.map((s) => (
          <label key={s.key} className="hof-field">
            <div className="hof-field__top">
              <span>{s.label}</span>
              <span className="hof-value">
                {["inspiredO2", "vqScatter"].includes(s.key)
                  ? params[s.key].toFixed(2)
                  : params[s.key]}
              </span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={params[s.key]}
              onChange={(e) => onChange(s.key, parseFloat(e.target.value))}
            />
          </label>
        ))}
      </div>

      <div className="hof-section">
        <p className="hof-section__label">View options</p>
        <div className="hof-toggles">
          <button
            className={`hof-toggle ${colorBlindSafe ? "hof-toggle--on" : ""}`}
            onClick={() => onColorBlind(!colorBlindSafe)}
          >
            <span>Colorblind-safe palette</span>
            <span className="hof-toggle__pill">{colorBlindSafe ? "On" : "Off"}</span>
          </button>
          <div className="hof-toggle hof-toggle--ghost">
            <span>Prefers-reduced-motion</span>
            <span className="hof-toggle__pill">{reducedMotion ? "On" : "Off"}</span>
          </div>
        </div>
      </div>

      <div className="hof-actions">
        <button className="hof-button" onClick={onReset}>
          Reset
        </button>
        <button className="hof-button hof-button--ghost" onClick={() => onPreset("rest")}>
          Baseline
        </button>
      </div>
    </div>
  );
}
