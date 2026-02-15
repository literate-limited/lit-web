export default function A11ySummary({ outputs, params }) {
  const lines = [];
  if (outputs.paO2) lines.push(`Arterial oxygen partial pressure is about ${outputs.paO2} mmHg.`);
  if (outputs.paCO2) lines.push(`Arterial carbon dioxide is about ${outputs.paCO2} mmHg.`);
  if (outputs.saO2) lines.push(`Hemoglobin saturation is roughly ${outputs.saO2} percent.`);
  if (outputs.cardiacOutput)
    lines.push(`Cardiac output is estimated at ${outputs.cardiacOutput} liters per minute.`);

  lines.push(
    `Current inputs: heart rate ${params.heartRate} bpm, respiratory rate ${params.respiratoryRate} per minute, tidal volume ${params.tidalVolume} milliliters, FiO2 ${params.inspiredO2}, hemoglobin ${params.hemoglobin} g/dL, membrane thickness ${params.membraneThickness}x, V/Q scatter ${params.vqScatter}.`
  );

  return (
    <div className="hof-card" aria-live="polite">
      <div className="hof-card__header">
        <p className="hof-kicker">Accessibility</p>
        <h2 className="hof-card__title">Text summary</h2>
      </div>
      <p className="hof-muted">{lines.join(" ")}</p>
    </div>
  );
}
