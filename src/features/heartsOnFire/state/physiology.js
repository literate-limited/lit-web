// Lightweight physiology helpers (stubs for now) to keep math centralized.

export function alveolarGasEquation({ fio2, pb = 760, ph2o = 47, paco2 = 40, rq = 0.8 }) {
  // PAO2 = FiO2 * (PB - PH2O) - PaCO2 / RQ
  return fio2 * (pb - ph2o) - paco2 / rq;
}

export function hillSaturation({ po2, p50 = 26.5, hillN = 2.7 }) {
  const ratio = (po2 ** hillN) / (p50 ** hillN + po2 ** hillN);
  return Math.max(0, Math.min(1, ratio));
}

export function oxygenContent({ hb, saO2, paO2 }) {
  // CaO2 = 1.34 * Hb * SaO2 + 0.0031 * PaO2
  return 1.34 * hb * saO2 + 0.0031 * paO2;
}

export function simulateOnce(params) {
  const paO2 = alveolarGasEquation({
    fio2: params.inspiredO2,
    paco2: 40,
  });
  const saO2 = hillSaturation({ po2: Math.max(paO2 - 5, 0) });
  const caO2 = oxygenContent({ hb: params.hemoglobin, saO2, paO2 });
  const cardiacOutput = ((params.heartRate * params.strokeVolume) / 1000).toFixed(2); // L/min

  return {
    paO2: Number(paO2.toFixed(1)),
    pvO2: null, // placeholder until full capillary curve is modeled
    saO2: Math.round(saO2 * 100),
    caO2: Number(caO2.toFixed(2)),
    cardiacOutput,
  };
}
