export default function ExplainOverlay() {
  return (
    <div className="hof-card hof-card--overlay">
      <div className="hof-card__header">
        <p className="hof-kicker">Explain Mode</p>
        <h2 className="hof-card__title">What you’re seeing</h2>
      </div>
      <ul className="hof-list">
        <li>Diffusion follows Fick’s law: flux = D · A / T · (PAO₂ − PcO₂).</li>
        <li>
          Oxygen content uses the Hill curve; hemoglobin saturation shifts with pH/CO₂/temp (coming in
          later phase).
        </li>
        <li>Color from blue → red tracks mixed venous to arterial oxygenation along the capillary.</li>
        <li>Inputs stay clamped to physiologic ranges; this is an educational simulation only.</li>
      </ul>
    </div>
  );
}
