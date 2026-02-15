import { describe, it, expect } from "vitest";
import { reducer, initialState, initialParams } from "./hofState.jsx";

describe("hofState reducer", () => {
  it("sets a param and clears preset", () => {
    const next = reducer(initialState, { type: "setParam", key: "heartRate", value: 90 });
    expect(next.params.heartRate).toBe(90);
    expect(next.presetId).toBeNull();
  });

  it("applies preset", () => {
    const params = { ...initialParams, heartRate: 101 };
    const next = reducer(initialState, { type: "applyPreset", id: "x", params });
    expect(next.params.heartRate).toBe(101);
    expect(next.presetId).toBe("x");
  });

  it("sets outputs", () => {
    const next = reducer(initialState, { type: "setOutputs", outputs: { paO2: 95 } });
    expect(next.outputs.paO2).toBe(95);
  });

  it("sets curves", () => {
    const next = reducer(initialState, { type: "setCurves", curves: { time: [0, 1] } });
    expect(next.curves.time.length).toBe(2);
  });

  it("sets baseline", () => {
    const next = reducer(initialState, {
      type: "setBaseline",
      outputs: { paO2: 90 },
      curves: { time: [0] },
    });
    expect(next.baseline.outputs.paO2).toBe(90);
    expect(next.baseline.curves.time[0]).toBe(0);
  });

  it("toggle colorblind flag", () => {
    const next = reducer(initialState, { type: "setColorBlind", value: true });
    expect(next.colorBlindSafe).toBe(true);
  });
});
