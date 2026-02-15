import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useSyncExternalStore } from "react";

export const initialParams = {
  heartRate: 72, // bpm
  strokeVolume: 70, // mL
  respiratoryRate: 12, // breaths/min
  tidalVolume: 500, // mL
  inspiredO2: 0.21, // fraction
  hemoglobin: 14, // g/dL
  membraneThickness: 1, // relative scale (1 = normal)
  vqScatter: 0.1, // 0-0.8 fraction of low V/Q units
};

export const presets = [
  {
    id: "rest",
    label: "Resting",
    note: "Normal resting physiology baseline.",
    params: initialParams,
  },
  {
    id: "exercise",
    label: "Exercise",
    note: "Higher HR/RR, slightly larger tidal volume.",
    params: {
      ...initialParams,
      heartRate: 110,
      respiratoryRate: 20,
      tidalVolume: 750,
    },
  },
  {
    id: "altitude",
    label: "High Altitude",
    note: "Lower inspired O2, modest hyperventilation.",
    params: {
      ...initialParams,
      inspiredO2: 0.16,
      respiratoryRate: 18,
    },
  },
  {
    id: "anemia",
    label: "Anemia",
    note: "Lower hemoglobin concentration.",
    params: {
      ...initialParams,
      hemoglobin: 9,
    },
  },
  {
    id: "edema",
    label: "Pulmonary Edema",
    note: "Thicker membrane reduces diffusion.",
    params: {
      ...initialParams,
      membraneThickness: 2.2,
    },
  },
];

export const initialState = {
  params: initialParams,
  presetId: "rest",
  outputs: {
    paO2: null,
    pvO2: null,
    saO2: null,
    caO2: null,
    cardiacOutput: null,
    paCO2: null,
  },
  curves: {
    time: [],
    capillaryPo2: [],
    saturation: [],
    gradient: [],
    capillaryPco2: [],
    co2Gradient: [],
    paO2Alveolar: null,
    paCO2Alveolar: null,
  },
  baseline: {
    outputs: null,
    curves: null,
  },
  status: "idle", // idle | running | paused
  reducedMotion: false,
  colorBlindSafe: false,
};

export function reducer(state, action) {
  switch (action.type) {
    case "setParam":
      return {
        ...state,
        params: { ...state.params, [action.key]: action.value },
        presetId: null,
      };
    case "applyPreset":
      return {
        ...state,
        params: { ...action.params },
        presetId: action.id,
      };
    case "setStatus":
      return { ...state, status: action.status };
    case "setOutputs":
      return { ...state, outputs: { ...state.outputs, ...action.outputs } };
    case "setCurves":
      return { ...state, curves: { ...state.curves, ...action.curves } };
    case "setParams":
      return { ...state, params: { ...state.params, ...action.params }, presetId: null };
    case "setBaseline":
      return {
        ...state,
        baseline: { outputs: action.outputs, curves: action.curves },
      };
    case "setReducedMotion":
      return { ...state, reducedMotion: action.value };
    case "setColorBlind":
      return { ...state, colorBlindSafe: action.value };
    case "reset":
      return { ...initialState };
    default:
      return state;
  }
}

const HofContext = createContext(null);

export function HofProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const listenersRef = useRef(new Set());
  const stateRef = useRef(state);

  const actions = useMemo(
    () => ({
      setParam: (key, value) => dispatch({ type: "setParam", key, value }),
      applyPreset: (id) => {
        const preset = presets.find((p) => p.id === id);
        if (preset) {
          dispatch({ type: "applyPreset", id, params: preset.params });
        }
      },
      setStatus: (status) => dispatch({ type: "setStatus", status }),
      setOutputs: (outputs) => dispatch({ type: "setOutputs", outputs }),
      setCurves: (curves) => dispatch({ type: "setCurves", curves }),
      setParams: (params) => dispatch({ type: "setParams", params }),
      setBaseline: (outputs, curves) => dispatch({ type: "setBaseline", outputs, curves }),
      setReducedMotion: (value) => dispatch({ type: "setReducedMotion", value }),
      setColorBlind: (value) => dispatch({ type: "setColorBlind", value }),
      reset: () => dispatch({ type: "reset" }),
    }),
    [dispatch]
  );

  useEffect(() => {
    stateRef.current = state;
    listenersRef.current.forEach((fn) => fn());
  }, [state]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    actions.setReducedMotion(media.matches);
    const handler = (e) => actions.setReducedMotion(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [actions]);

  const subscribe = (fn) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  };

  const value = useMemo(
    () => ({
      state,
      getState: () => stateRef.current,
      subscribe,
      ...actions,
    }),
    [state, actions]
  );

  return <HofContext.Provider value={value}>{children}</HofContext.Provider>;
}

export function useHof() {
  const ctx = useContext(HofContext);
  if (!ctx) throw new Error("useHof must be used within HofProvider");
  return ctx;
}

export function useHofSelector(selector) {
  const store = useHof();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}
