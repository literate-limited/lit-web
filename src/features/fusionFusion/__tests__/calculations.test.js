import { describe, it, expect } from "vitest";
import { evaluateScenario, fusionPower, tripleProduct } from "../utils/calculations";

describe("fusionFusion calculations", () => {
  it("computes increasing fusion power with temperature", () => {
    const low = fusionPower({ fuel: "DT", density: 1e20, temperatureKeV: 8, volume: 100 });
    const high = fusionPower({ fuel: "DT", density: 1e20, temperatureKeV: 20, volume: 100 });
    expect(high).toBeGreaterThan(low);
  });

  it("computes triple product", () => {
    const tp = tripleProduct({ density: 1e20, temperatureKeV: 10, confinementTime: 1 });
    expect(tp).toBe(1e21);
  });

  it("returns sensible Q values", () => {
    const res = evaluateScenario({
      fuel: "DT",
      density: 1e20,
      temperatureKeV: 15,
      confinementTime: 1,
      plasmaVolume: 100,
      heatingPowerMW: 50,
      wallEfficiency: 0.35,
      recircFraction: 0.15,
      radLossFrac: 0.15,
    });
    expect(res.qPlasma).toBeGreaterThan(0);
    expect(res.triple).toBeGreaterThan(0);
  });
});
