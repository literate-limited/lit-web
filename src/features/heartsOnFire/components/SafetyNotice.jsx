export default function SafetyNotice() {
  return (
    <div className="hof-card hof-card--overlay hof-safety">
      <div>
        <p className="hof-kicker">Safety</p>
        <h2 className="hof-card__title">Educational only</h2>
      </div>
      <p className="hof-muted">
        This simulation simplifies cardiopulmonary physiology (perfect mixing, single V/Q bucket,
        capped ranges). It is not a medical device or diagnostic tool. Always consult clinicians for
        real-world decisions.
      </p>
    </div>
  );
}
