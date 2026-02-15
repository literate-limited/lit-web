import { useEffect, useMemo, useRef, useState } from "react";

const TARGET_SAO2 = 92;
const TARGET_HOLD_MS = 5000;
const LEVEL2_TARGET_SAO2 = 95;
const LEVEL2_HYPOXIA_SAO2 = 88;

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

export default function MissionOverlay({
  outputs,
  params,
  effectiveParams,
  pumpBoost,
  transient,
  onHoldBreath,
  onHyperventilate,
  onGiveO2,
}) {
  const [active, setActive] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [level, setLevel] = useState(1);
  const [hasPumped, setHasPumped] = useState(false);
  const [hasHeldBreath, setHasHeldBreath] = useState(false);
  const [hasHypervented, setHasHypervented] = useState(false);
  const [hasGivenO2, setHasGivenO2] = useState(false);
  const [sawHypoxia, setSawHypoxia] = useState(false);
  const [stableMs, setStableMs] = useState(0);

  const stableIntervalRef = useRef(null);
  const lastNowRef = useRef(null);
  const saO2Ref = useRef(null);

  const saO2 = outputs?.saO2;
  const paO2 = outputs?.paO2;
  const cardiacOutput = outputs?.cardiacOutput;

  const isObserving = Number.isFinite(saO2);
  const stabilityTarget = level === 2 ? LEVEL2_TARGET_SAO2 : TARGET_SAO2;
  const isStable = Number.isFinite(saO2) && saO2 >= stabilityTarget;

  useEffect(() => {
    if (!active) return;
    if (pumpBoost > 0) setHasPumped(true);
  }, [active, pumpBoost]);

  useEffect(() => {
    saO2Ref.current = saO2;
  }, [saO2]);

  useEffect(() => {
    if (!active) return;
    const rr = transient?.respiratoryRate;
    const tv = transient?.tidalVolume;
    const fio2 = transient?.inspiredO2;
    if (rr != null && rr <= 0) setHasHeldBreath(true);
    if (rr != null && rr >= 28) setHasHypervented(true);
    if (tv != null && tv >= 800) setHasHypervented(true);
    if (fio2 != null && fio2 >= 0.6) setHasGivenO2(true);
  }, [active, transient?.inspiredO2, transient?.respiratoryRate, transient?.tidalVolume]);

  useEffect(() => {
    if (!active) return;
    if (!Number.isFinite(saO2)) return;
    if (level === 2 && saO2 < LEVEL2_HYPOXIA_SAO2) setSawHypoxia(true);
  }, [active, level, saO2]);

  useEffect(() => {
    if (!active) {
      if (stableIntervalRef.current) clearInterval(stableIntervalRef.current);
      stableIntervalRef.current = null;
      lastNowRef.current = null;
      setStableMs(0);
      return;
    }

    if (stableIntervalRef.current) clearInterval(stableIntervalRef.current);
    lastNowRef.current = performance.now();

    stableIntervalRef.current = setInterval(() => {
      const now = performance.now();
      const last = lastNowRef.current ?? now;
      const dt = now - last;
      lastNowRef.current = now;

      const currentSaO2 = saO2Ref.current;
      if (!Number.isFinite(currentSaO2)) {
        setStableMs(0);
        return;
      }

      if (currentSaO2 >= stabilityTarget) {
        setStableMs((prev) => clamp(prev + dt, 0, TARGET_HOLD_MS));
      } else {
        setStableMs(0);
      }
    }, 120);

    return () => {
      if (stableIntervalRef.current) clearInterval(stableIntervalRef.current);
      stableIntervalRef.current = null;
    };
  }, [active, stabilityTarget]);

  const holdPct = useMemo(() => {
    if (!active) return 0;
    if (!Number.isFinite(stableMs)) return 0;
    return clamp((stableMs / TARGET_HOLD_MS) * 100, 0, 100);
  }, [active, stableMs]);

  const steps = useMemo(() => {
    if (level === 2) {
      return [
        {
          id: "observe",
          title: "Observe baseline",
          desc: "Get a feel for the readouts before you perturb anything.",
          done: isObserving,
        },
        {
          id: "holdBreath",
          title: "Interact: hold breath",
          desc: "Click Hold breath to cut ventilation temporarily.",
          done: hasHeldBreath,
        },
        {
          id: "hypoxia",
          title: `Observe: induce hypoxia (SaO2 < ${LEVEL2_HYPOXIA_SAO2}%)`,
          desc: "Push the system into trouble, then bring it back.",
          done: sawHypoxia,
        },
        {
          id: "recover",
          title: `Recover: stabilize SaO2 >= ${LEVEL2_TARGET_SAO2}%`,
          desc: `Use Hyperventilate and/or Give O2; hold above target for ${Math.round(
            TARGET_HOLD_MS / 1000
          )} seconds.`,
          done: stableMs >= TARGET_HOLD_MS,
          progressPct: holdPct,
        },
      ];
    }

    return [
      {
        id: "observe",
        title: "Observe baseline",
        desc: "Watch SaO2, PaO2, and cardiac output respond to your inputs.",
        done: isObserving,
      },
      {
        id: "pump",
        title: "Interact: pump the heart",
        desc: "Press Pump in the heart view to temporarily boost heart rate.",
        done: hasPumped,
      },
      {
        id: "stabilize",
        title: `Observe: stabilize SaO2 >= ${TARGET_SAO2}%`,
        desc: `Hold oxygen saturation above target for ${Math.round(TARGET_HOLD_MS / 1000)} seconds.`,
        done: stableMs >= TARGET_HOLD_MS,
        progressPct: holdPct,
      },
    ];
  }, [
    hasHeldBreath,
    hasPumped,
    holdPct,
    isObserving,
    level,
    sawHypoxia,
    stableMs,
  ]);

  const hint = useMemo(() => {
    if (!active) return "";
    if (!Number.isFinite(saO2)) return "Waiting for sim outputs...";
    if (saO2 >= stabilityTarget) return "Nice. Keep it stable for a few seconds.";

    if (transient?.respiratoryRate != null && transient.respiratoryRate <= 0) {
      return "Breath hold is active; wait for ventilation to resume.";
    }
    if (transient?.inspiredO2 != null && transient.inspiredO2 >= 0.6) {
      return "O2 boost is active; give it a moment, or also increase ventilation.";
    }

    const fio2 = Number.isFinite(effectiveParams?.inspiredO2) ? effectiveParams.inspiredO2 : null;
    const rr = Number.isFinite(effectiveParams?.respiratoryRate) ? effectiveParams.respiratoryRate : null;
    const tv = Number.isFinite(effectiveParams?.tidalVolume) ? effectiveParams.tidalVolume : null;
    const thickness = Number.isFinite(params?.membraneThickness) ? params.membraneThickness : null;
    const vq = Number.isFinite(params?.vqScatter) ? params.vqScatter : null;

    if (fio2 != null && fio2 < 0.3) return "Try increasing inspired O2 (FiO2).";
    if (rr != null && rr < 14) return "Try increasing respiratory rate.";
    if (tv != null && tv < 550) return "Try increasing tidal volume.";
    if (thickness != null && thickness > 1.2) return "Try decreasing membrane thickness.";
    if (vq != null && vq > 0.25) return "Try reducing V/Q scatter.";
    return "Try boosting ventilation or inspired O2 until SaO2 recovers.";
  }, [active, effectiveParams, params, saO2, stabilityTarget, transient]);

  const start = () => {
    setActive(true);
    setLevel((prev) => prev);
    setHasPumped(false);
    setHasHeldBreath(false);
    setHasHypervented(false);
    setHasGivenO2(false);
    setSawHypoxia(false);
    setStableMs(0);
    lastNowRef.current = null;
  };

  const switchLevel = (next) => {
    setLevel(next);
    setHasPumped(false);
    setHasHeldBreath(false);
    setHasHypervented(false);
    setHasGivenO2(false);
    setSawHypoxia(false);
    setStableMs(0);
    lastNowRef.current = null;
  };

  const effectiveLabel = useMemo(() => {
    const effectiveFio2 = Number.isFinite(effectiveParams?.inspiredO2) ? effectiveParams.inspiredO2 : null;
    const effectiveRr = Number.isFinite(effectiveParams?.respiratoryRate) ? effectiveParams.respiratoryRate : null;
    const effectiveTv = Number.isFinite(effectiveParams?.tidalVolume) ? effectiveParams.tidalVolume : null;

    const parts = [];
    if (effectiveFio2 != null) parts.push(`FiO2 ${effectiveFio2.toFixed(2)}`);
    if (effectiveRr != null) parts.push(`RR ${Math.round(effectiveRr)}/min`);
    if (effectiveTv != null) parts.push(`VT ${Math.round(effectiveTv)} mL`);
    return parts.join(" • ");
  }, [effectiveParams]);

  if (hidden) return null;

  return (
    <div className="hof-card hof-card--overlay">
      <div className="hof-mission__top">
        <div>
          <p className="hof-kicker">Level {level}</p>
          <h2 className="hof-card__title">Observe, interact, observe</h2>
          <p className="hof-muted text-sm">
            A tiny loop to stress-test the sim and UI. Iterate on this pattern as we add organs and
            environment.
          </p>
          {effectiveLabel && <p className="hof-muted text-xs">Effective inputs: {effectiveLabel}</p>}
          <div className="hof-mission__levels" role="tablist" aria-label="Mission levels">
            <button
              className={`hof-level ${level === 1 ? "hof-level--active" : ""}`}
              onClick={() => switchLevel(1)}
              type="button"
            >
              Level 1
            </button>
            <button
              className={`hof-level ${level === 2 ? "hof-level--active" : ""}`}
              onClick={() => switchLevel(2)}
              type="button"
            >
              Level 2
            </button>
          </div>
        </div>
        <div className="hof-mission__actions">
          {!active ? (
            <button className="hof-button" onClick={start}>
              Start
            </button>
          ) : (
            <button className="hof-button" onClick={start}>
              Reset
            </button>
          )}
          <button
            className="hof-button hof-button--ghost"
            onClick={() => setActive(false)}
            disabled={!active}
          >
            Pause
          </button>
          <button className="hof-button hof-button--ghost" onClick={() => setHidden(true)}>
            Hide
          </button>
        </div>
      </div>

      <div className="hof-mission__quick">
        <div className="hof-mission__quickLabel">Quick actions</div>
        <div className="hof-mission__quickButtons">
          <button className="hof-button hof-button--ghost" onClick={onHoldBreath} disabled={!active}>
            Hold breath
          </button>
          <button className="hof-button hof-button--ghost" onClick={onHyperventilate} disabled={!active}>
            Hyperventilate
          </button>
          <button className="hof-button hof-button--ghost" onClick={onGiveO2} disabled={!active}>
            Give O2
          </button>
        </div>
        <div className="hof-mission__quickStatus hof-muted text-xs">
          {hasHeldBreath ? "Breath-hold used. " : ""}
          {hasHypervented ? "Hypervent used. " : ""}
          {hasGivenO2 ? "O2 used. " : ""}
          {!hasHeldBreath && !hasHypervented && !hasGivenO2 ? "Use buttons to perturb inputs without moving sliders." : ""}
        </div>
      </div>

      <div className="hof-mission__grid">
        <div className="hof-mission__steps">
          {steps.map((s) => (
            <div
              key={s.id}
              className={`hof-step ${s.done ? "hof-step--done" : ""} ${
                active && s.id === "stabilize" && isStable ? "hof-step--active" : ""
              }`}
            >
              <div className="hof-step__check" aria-hidden="true" />
              <div className="hof-step__body">
                <div className="hof-step__title">{s.title}</div>
                <div className="hof-step__desc">{s.desc}</div>
                {s.id === "stabilize" && active && (
                  <div className="hof-step__progress">
                    <div className="hof-progress" aria-label="Stability progress">
                      <div className="hof-progress__fill" style={{ width: `${s.progressPct || 0}%` }} />
                    </div>
                    <div className="hof-muted text-xs">{Math.round(s.progressPct || 0)}%</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="hof-mission__readout">
          <div className="hof-metrics">
            <div className="hof-metric">
              <div className="hof-metric__label">SaO2</div>
              <div className="hof-metric__value">
                {Number.isFinite(saO2) ? saO2 : "—"}
                <span className="hof-metric__unit">%</span>
              </div>
            </div>
            <div className="hof-metric">
              <div className="hof-metric__label">PaO2</div>
              <div className="hof-metric__value">
                {Number.isFinite(paO2) ? paO2 : "—"}
                <span className="hof-metric__unit">mmHg</span>
              </div>
            </div>
            <div className="hof-metric">
              <div className="hof-metric__label">Cardiac output</div>
              <div className="hof-metric__value">
                {Number.isFinite(cardiacOutput) ? cardiacOutput : "—"}
                <span className="hof-metric__unit">L/min</span>
              </div>
            </div>
          </div>

          {hint && (
            <div className="hof-mission__hint">
              <div className="hof-mission__hintLabel">Hint</div>
              <div className="hof-mission__hintText">{hint}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
