import { describe, it, expect } from "vitest";
import {
  runSimulation,
  alveolarGasEquation,
  hillSaturation,
  oxygenContent,
  alveolarVentilation,
  clamp,
} from "./simulationCore";

describe("physiology helpers", () => {
  it("clamps numbers", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(22, 0, 10)).toBe(10);
  });

  it("computes alveolar gas equation within range", () => {
    const pao2 = alveolarGasEquation({ fio2: 0.21, pb: 760, paco2: 40, rq: 0.8 });
    expect(pao2).toBeGreaterThan(80);
    expect(pao2).toBeLessThan(120);
  });

  it("returns monotonic Hill saturation", () => {
    const low = hillSaturation({ po2: 20 });
    const mid = hillSaturation({ po2: 60 });
    const high = hillSaturation({ po2: 100 });
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
    expect(high).toBeLessThanOrEqual(1);
  });

  it("computes oxygen content with Hb contribution", () => {
    const ca = oxygenContent({ hb: 15, saO2: 0.97, paO2: 95 });
    expect(ca).toBeGreaterThan(19);
    expect(ca).toBeLessThan(22);
  });

  it("alveolar ventilation scales with rate and VT", () => {
    const base = alveolarVentilation(500, 12);
    const doubled = alveolarVentilation(700, 18);
    expect(doubled).toBeGreaterThan(base);
  });
});

describe("runSimulation", () => {
  const baseParams = {
    heartRate: 72,
    strokeVolume: 70,
    respiratoryRate: 12,
    tidalVolume: 500,
    inspiredO2: 0.21,
    hemoglobin: 14,
    membraneThickness: 1,
    vqScatter: 0.1,
  };

  it("returns physiologic ranges", () => {
    const { outputs, curves } = runSimulation(baseParams);
    expect(outputs.paO2).toBeGreaterThan(70);
    expect(outputs.paO2).toBeLessThan(120);
    expect(outputs.saO2).toBeGreaterThan(90);
    expect(outputs.caO2).toBeGreaterThan(15);
    expect(outputs.cardiacOutput).toBeGreaterThan(3);
    expect(outputs.paCO2).toBeGreaterThan(25);
    expect(curves.capillaryPo2.length).toBeGreaterThan(50);
    expect(curves.capillaryPco2.length).toBeGreaterThan(50);
  });

  it("responds to V/Q scatter with lower PaO2", () => {
    const baseline = runSimulation({ ...baseParams, vqScatter: 0 });
    const worse = runSimulation({ ...baseParams, vqScatter: 0.6 });
    expect(worse.outputs.paO2).toBeLessThan(baseline.outputs.paO2);
  });

  it("responds to hyperventilation with lower PaCO2", () => {
    const base = runSimulation(baseParams);
    const hyper = runSimulation({ ...baseParams, respiratoryRate: 24, tidalVolume: 650 });
    expect(hyper.outputs.paCO2).toBeLessThan(base.outputs.paCO2);
  });
});
