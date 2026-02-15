import ChartSparkline from "./ChartSparkline.jsx";
import { saturationToColor } from "../state/colors.js";

const fields = [
  { key: "paO2", label: "Arterial PO₂", unit: "mmHg" },
  { key: "pvO2", label: "Venous PO₂", unit: "mmHg" },
  { key: "saO2", label: "SaO₂", unit: "%" },
  { key: "caO2", label: "CaO₂", unit: "mL O₂/dL" },
  { key: "cardiacOutput", label: "Cardiac Output", unit: "L/min" },
  { key: "paCO2", label: "PaCO₂", unit: "mmHg" },
];

export default function ChartsPanel({ outputs, curves, status, colorBlind }) {
  const color = saturationToColor(outputs.saO2 || 75, colorBlind);

  return (
    <div className="hof-card">
      <div className="hof-card__header">
        <p className="hof-kicker">Oxygenation</p>
        <h2 className="hof-card__title">Live metrics</h2>
        <p className="hof-muted">Worker sim updates capillary PO₂ and saturation over one transit.</p>
      </div>

      <div className="hof-metrics">
        {fields.map((f) => (
          <div key={f.key} className="hof-metric">
            <div className="hof-metric__label">{f.label}</div>
            <div className="hof-metric__value">
              {outputs[f.key] !== null && outputs[f.key] !== undefined ? outputs[f.key] : "—"}
              <span className="hof-metric__unit">{f.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="hof-chart-grid">
        <div>
          <div className="hof-chart-label">
            Capillary PO₂ (mmHg) — Alveolar PAO₂ ~ {curves.paO2Alveolar ? curves.paO2Alveolar.toFixed(0) : "—"}
          </div>
          <ChartSparkline data={curves.capillaryPo2} color={color} />
        </div>
        <div>
          <div className="hof-chart-label">Saturation along capillary (%)</div>
          <ChartSparkline data={curves.saturation} color={color} />
        </div>
        <div>
          <div className="hof-chart-label">Gradient (PAO₂ − PcO₂)</div>
          <ChartSparkline data={curves.gradient} color="#22d3ee" />
        </div>
        <div>
          <div className="hof-chart-label">
            Capillary PCO₂ (mmHg) — Alveolar PCO₂ ~ {curves.paCO2Alveolar ? curves.paCO2Alveolar.toFixed(0) : "—"}
          </div>
          <ChartSparkline data={curves.capillaryPco2} color="#22d3ee" />
        </div>
        <div>
          <div className="hof-chart-label">CO₂ gradient (PcCO₂ − PACO₂)</div>
          <ChartSparkline data={curves.co2Gradient} color="#38bdf8" />
        </div>
      </div>

      <div className="hof-muted text-xs">Status: {status}</div>
    </div>
  );
}
