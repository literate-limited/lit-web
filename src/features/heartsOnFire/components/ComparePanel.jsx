function Delta({ label, current, baseline, unit }) {
  if (baseline == null || current == null) return null;
  const delta = current - baseline;
  const sign = delta > 0 ? "+" : "";
  const tone = delta > 0 ? "hof-delta--up" : delta < 0 ? "hof-delta--down" : "";
  return (
    <div className={`hof-compare__item ${tone}`}>
      <div className="hof-compare__label">{label}</div>
      <div className="hof-compare__value">
        {current}
        <span className="hof-metric__unit">{unit}</span>
      </div>
      <div className="hof-compare__delta">
        {sign}
        {delta.toFixed ? delta.toFixed(1) : delta} {unit}
      </div>
    </div>
  );
}

export default function ComparePanel({ outputs, baseline }) {
  if (!baseline) return null;
  return (
    <div className="hof-card">
      <div className="hof-card__header">
        <p className="hof-kicker">Compare</p>
        <h2 className="hof-card__title">Vs baseline (rest)</h2>
        <p className="hof-muted">Baseline is auto-set to resting values; watch how your tweaks shift oxygenation.</p>
      </div>
      <div className="hof-compare">
        <Delta label="PaO₂" current={outputs.paO2} baseline={baseline.paO2} unit="mmHg" />
        <Delta label="SaO₂" current={outputs.saO2} baseline={baseline.saO2} unit="%" />
        <Delta label="CaO₂" current={outputs.caO2} baseline={baseline.caO2} unit="mL/dL" />
        <Delta
          label="Cardiac Output"
          current={outputs.cardiacOutput}
          baseline={baseline.cardiacOutput}
          unit="L/min"
        />
        <Delta label="PaCO₂" current={outputs.paCO2} baseline={baseline.paCO2} unit="mmHg" />
      </div>
    </div>
  );
}
