import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./styles/heartsOnFire.css";
import ControlPanel from "./components/ControlPanel.jsx";
import HeartScene from "./components/HeartScene.jsx";
import AlveoliScene from "./components/AlveoliScene.jsx";
import ChartsPanel from "./components/ChartsPanel.jsx";
import ExplainOverlay from "./components/ExplainOverlay.jsx";
import MissionOverlay from "./components/MissionOverlay.jsx";
import ComparePanel from "./components/ComparePanel.jsx";
import SafetyNotice from "./components/SafetyNotice.jsx";
import SaveBar from "./components/SaveBar.jsx";
import A11ySummary from "./components/A11ySummary.jsx";
import { HofProvider, useHof, useHofSelector } from "./state/hofState.jsx";
import {
  selectParams,
  selectOutputs,
  selectCurves,
  selectBaseline,
  selectFlags,
  selectPresetId,
  selectStatus,
} from "./state/hofSelectors.js";
import { fetchSharedScenario } from "./api.js";

function decodeBase64Url(input) {
  if (!input) return "";
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLen);
  return atob(padded);
}

function HeartsOnFireShell() {
  const { setParam, applyPreset, reset, setOutputs, setCurves, setStatus, setBaseline, setColorBlind, setParams } =
    useHof();
  const stateParams = useHofSelector(selectParams);
  const stateOutputs = useHofSelector(selectOutputs);
  const stateCurves = useHofSelector(selectCurves);
  const stateBaseline = useHofSelector(selectBaseline);
  const stateFlags = useHofSelector(selectFlags);
  const presetId = useHofSelector(selectPresetId);
  const simStatus = useHofSelector(selectStatus);
  const [searchParams] = useSearchParams();
  const [pumpBoost, setPumpBoost] = useState(0);
  const [transient, setTransient] = useState({
    inspiredO2: null,
    respiratoryRate: null,
    tidalVolume: null,
  });

  const worker = useMemo(
    () =>
      new Worker(new URL("./workers/simulation.worker.js", import.meta.url), {
        type: "module",
      }),
    []
  );

  const baselineSeeded = useRef(false);
  const runIdRef = useRef(0);
  const pumpTimeoutRef = useRef(null);
  const transientTimeoutsRef = useRef({});

  useEffect(() => () => worker.terminate(), [worker]);

  useEffect(() => {
    return () => {
      if (pumpTimeoutRef.current) {
        clearTimeout(pumpTimeoutRef.current);
        pumpTimeoutRef.current = null;
      }

      const timeouts = transientTimeoutsRef.current || {};
      Object.keys(timeouts).forEach((key) => {
        if (timeouts[key]) clearTimeout(timeouts[key]);
        timeouts[key] = null;
      });
    };
  }, []);

  const effectiveHeartRate = useMemo(() => {
    const base = Number.isFinite(stateParams?.heartRate) ? stateParams.heartRate : 72;
    const boosted = base + pumpBoost;
    return Math.min(180, Math.max(40, boosted));
  }, [stateParams?.heartRate, pumpBoost]);

  const effectiveParams = useMemo(() => {
    const base = stateParams || {};
    const inspiredO2 =
      transient.inspiredO2 == null ? base.inspiredO2 : Math.min(1, Math.max(0.12, transient.inspiredO2));
    const respiratoryRate =
      transient.respiratoryRate == null
        ? base.respiratoryRate
        : Math.min(32, Math.max(0, transient.respiratoryRate));
    const tidalVolume =
      transient.tidalVolume == null ? base.tidalVolume : Math.min(900, Math.max(300, transient.tidalVolume));

    return {
      ...base,
      inspiredO2,
      respiratoryRate,
      tidalVolume,
    };
  }, [stateParams, transient.inspiredO2, transient.respiratoryRate, transient.tidalVolume]);

  const simParams = useMemo(
    () => ({
      ...effectiveParams,
      heartRate: effectiveHeartRate,
    }),
    [effectiveParams, effectiveHeartRate]
  );

  const pumpHeart = () => {
    const boostStep = stateFlags.reducedMotion ? 12 : 24;
    const decayMs = stateFlags.reducedMotion ? 450 : 750;
    setPumpBoost((prev) => Math.min(80, prev + boostStep));
    if (pumpTimeoutRef.current) clearTimeout(pumpTimeoutRef.current);
    pumpTimeoutRef.current = setTimeout(() => setPumpBoost(0), decayMs);
  };

  const setTransientOverride = (key, value, ms) => {
    setTransient((prev) => ({ ...prev, [key]: value }));
    if (transientTimeoutsRef.current[key]) clearTimeout(transientTimeoutsRef.current[key]);
    transientTimeoutsRef.current[key] = setTimeout(() => {
      setTransient((prev) => ({ ...prev, [key]: null }));
      transientTimeoutsRef.current[key] = null;
    }, ms);
  };

  const holdBreath = () => {
    const ms = stateFlags.reducedMotion ? 3500 : 6000;
    setTransientOverride("respiratoryRate", 0, ms);
  };

  const hyperventilate = () => {
    const ms = stateFlags.reducedMotion ? 4500 : 8000;
    setTransientOverride("respiratoryRate", 32, ms);
    setTransientOverride("tidalVolume", 900, ms);
  };

  const giveO2 = () => {
    const ms = stateFlags.reducedMotion ? 6000 : 12000;
    setTransientOverride("inspiredO2", 1.0, ms);
  };

  useEffect(() => {
    const handle = (event) => {
      if (event.data?.type !== "result") return;
      const { outputs, curves, tag, runId } = event.data;
      if (tag === "current" && runId !== runIdRef.current) return;
      if (tag === "baseline") {
        setBaseline(outputs, curves);
      } else {
        setOutputs(outputs);
        setCurves(curves);
        setStatus("idle");
      }
    };
    worker.addEventListener("message", handle);
    return () => worker.removeEventListener("message", handle);
  }, [worker, setBaseline, setCurves, setOutputs, setStatus]);

  useEffect(() => {
    setStatus("running");
    runIdRef.current += 1;
    const runId = runIdRef.current;
    worker.postMessage({ type: "run", params: simParams, tag: "current", runId });
    if (!baselineSeeded.current) {
      worker.postMessage({
        type: "run",
        params: {
          heartRate: 72,
          strokeVolume: 70,
          respiratoryRate: 12,
          tidalVolume: 500,
          inspiredO2: 0.21,
          hemoglobin: 14,
          membraneThickness: 1,
          vqScatter: 0.1,
        },
        tag: "baseline",
      });
      baselineSeeded.current = true;
    }
  }, [simParams, setStatus, worker]);

  useEffect(() => {
    const packed = searchParams.get("p");
    if (!packed) return;
    try {
      const decoded = decodeBase64Url(packed);
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === "object") {
        setParams(parsed);
        setOutputs({});
        setCurves({});
      }
    } catch {
      // ignore invalid packed params
    }
  }, [searchParams, setParams, setOutputs, setCurves]);

  useEffect(() => {
    const share = searchParams.get("share");
    if (searchParams.get("p")) return;
    if (!share) return;
    fetchSharedScenario(share)
      .then((res) => {
        if (res?.scenario?.params) {
          setParams(res.scenario.params);
          setOutputs(res.scenario.outputs || {});
          setCurves(res.scenario.curves || {});
        }
      })
      .catch(() => {
        // ignore invalid share
      });
  }, [searchParams, setParams, setOutputs, setCurves]);

  return (
    <div className="hof-page">
      <ControlPanel
        params={stateParams}
        presetId={presetId}
        onChange={setParam}
        onPreset={applyPreset}
        onReset={reset}
        colorBlindSafe={stateFlags.colorBlindSafe}
        onColorBlind={(v) => setColorBlind(v)}
        reducedMotion={stateFlags.reducedMotion}
      />
      <div className="hof-main">
        <MissionOverlay
          outputs={stateOutputs}
          params={stateParams}
          effectiveParams={simParams}
          pumpBoost={pumpBoost}
          transient={transient}
          onHoldBreath={holdBreath}
          onHyperventilate={hyperventilate}
          onGiveO2={giveO2}
        />
        <HeartScene
          heartRate={effectiveHeartRate}
          saturation={stateOutputs.saO2}
          colorBlind={stateFlags.colorBlindSafe}
          reducedMotion={stateFlags.reducedMotion}
          onPump={pumpHeart}
        />
        <AlveoliScene
          saturation={stateOutputs.saO2}
          colorBlind={stateFlags.colorBlindSafe}
          reducedMotion={stateFlags.reducedMotion}
        />
        <ChartsPanel
          outputs={stateOutputs}
          curves={stateCurves}
          status={simStatus}
          colorBlind={stateFlags.colorBlindSafe}
        />
        <ComparePanel outputs={stateOutputs} baseline={stateBaseline.outputs} />
        <SaveBar />
        <ExplainOverlay />
        <SafetyNotice />
        <A11ySummary outputs={stateOutputs} params={stateParams} />
      </div>
    </div>
  );
}

export default function HeartsOnFirePage() {
  return (
    <HofProvider>
      <HeartsOnFireShell />
    </HofProvider>
  );
}
