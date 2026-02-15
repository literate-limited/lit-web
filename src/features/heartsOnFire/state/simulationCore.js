// Shared simulation core for Hearts on Fire (used by worker and tests)
const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

const DEAD_SPACE = 150; // mL
const BASE_VENT = (500 - DEAD_SPACE) * 12; // baseline alveolar ventilation mL/min

function alveolarGasEquation({ fio2, pb = 760, ph2o = 47, paco2 = 40, rq = 0.82 }) {
  return fio2 * (pb - ph2o) - paco2 / rq;
}

function hillSaturation({ po2, p50 = 26.5, hillN = 2.7 }) {
  const ratio = (po2 ** hillN) / (p50 ** hillN + po2 ** hillN);
  return clamp(ratio, 0, 1);
}

function oxygenContent({ hb, saO2, paO2 }) {
  return 1.34 * hb * saO2 + 0.0031 * paO2;
}

function alveolarVentilation(tidalVolume, respiratoryRate) {
  return Math.max(1, (tidalVolume - DEAD_SPACE) * respiratoryRate);
}

function runSimulation(params) {
  const {
    heartRate,
    strokeVolume,
    respiratoryRate,
    tidalVolume,
    inspiredO2,
    hemoglobin,
    membraneThickness,
    vqScatter = 0,
  } = params;

  const pb = 760;
  const alveolarVent = alveolarVentilation(tidalVolume, respiratoryRate);
  const paCO2Alveolar = clamp(40 * (BASE_VENT / alveolarVent), 20, 80);
  const paO2Alveolar = alveolarGasEquation({ fio2: inspiredO2, pb, paco2: paCO2Alveolar });

  const lowVq = clamp(vqScatter, 0, 0.8);
  const paO2Low = alveolarGasEquation({ fio2: inspiredO2 * 0.9, pb, paco2: paCO2Alveolar * 1.15 }) * 0.9;
  const effectivePAO2 = paO2Alveolar * (1 - lowVq) + paO2Low * lowVq;

  const steps = 120;
  const venousStart = 40;
  const venousCO2Start = 46;
  const capillary = [];
  const capillaryCO2 = [];
  const saturationCurve = [];
  const gradientCurve = [];
  const co2GradientCurve = [];
  const time = [];

  const baseTransit = 0.75;
  const transitTime = clamp(baseTransit * (72 / heartRate), 0.25, 0.95);
  const dt = transitTime / steps;

  const areaScale = clamp(tidalVolume / 500, 0.6, 2.4);
  const diffCoef = (areaScale / membraneThickness) * 18;
  const diffCoefCO2 = diffCoef * 1.2;

  let pcO2 = venousStart;
  let pcCO2 = venousCO2Start;
  for (let i = 0; i < steps; i += 1) {
    const alveolarPO2 = effectivePAO2;
    const alveolarPCO2 = paCO2Alveolar;

    const gradient = alveolarPO2 - pcO2;
    const flux = diffCoef * gradient * dt;
    pcO2 = clamp(pcO2 + flux, venousStart, alveolarPO2);

    const co2Grad = pcCO2 - alveolarPCO2;
    const co2Flux = diffCoefCO2 * co2Grad * dt;
    pcCO2 = clamp(pcCO2 - co2Flux, alveolarPCO2, venousCO2Start);

    const sat = hillSaturation({ po2: pcO2 });

    time.push(i * dt);
    capillary.push(pcO2);
    gradientCurve.push(Math.max(0, gradient));
    saturationCurve.push(sat * 100);
    capillaryCO2.push(pcCO2);
    co2GradientCurve.push(Math.max(0, co2Grad));
  }

  const paO2Final = capillary[capillary.length - 1];
  const saO2Final = saturationCurve[saturationCurve.length - 1] / 100;
  const caO2 = oxygenContent({ hb: hemoglobin, saO2: saO2Final, paO2: paO2Final });
  const cardiacOutput = (heartRate * strokeVolume) / 1000;
  const paCO2Final = capillaryCO2[capillaryCO2.length - 1];

  return {
    outputs: {
      paO2: Number(paO2Final.toFixed(1)),
      pvO2: venousStart,
      saO2: Math.round(saO2Final * 100),
      caO2: Number(caO2.toFixed(2)),
      cardiacOutput: Number(cardiacOutput.toFixed(2)),
      paCO2: Number(paCO2Final.toFixed(1)),
    },
    curves: {
      time,
      capillaryPo2: capillary.map((v) => Number(v.toFixed(1))),
      saturation: saturationCurve.map((v) => Number(v.toFixed(1))),
      gradient: gradientCurve.map((v) => Number(v.toFixed(1))),
      capillaryPco2: capillaryCO2.map((v) => Number(v.toFixed(1))),
      co2Gradient: co2GradientCurve.map((v) => Number(v.toFixed(1))),
      paO2Alveolar,
      paCO2Alveolar,
    },
  };
}

export {
  runSimulation,
  alveolarGasEquation,
  hillSaturation,
  oxygenContent,
  alveolarVentilation,
  clamp,
};
