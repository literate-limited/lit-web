import { FUSION_ENERGY_J, SIGMA_V_DT, LAWSON_TARGET } from "../data/constants";

// Linear interpolate on table
const interp = (table, x) => {
  if (!Array.isArray(table) || table.length === 0) return 0;
  if (x <= table[0].T) return table[0].value;
  if (x >= table[table.length - 1].T) return table[table.length - 1].value;
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i];
    const b = table[i + 1];
    if (x >= a.T && x <= b.T) {
      const t = (x - a.T) / (b.T - a.T);
      return a.value + t * (b.value - a.value);
    }
  }
  return table[table.length - 1].value;
};

export function fusionPower({
  fuel = "DT",
  density = 1e20, // m^-3 total ion density
  temperatureKeV = 10,
  volume = 100, // m^3
}) {
  if (fuel !== "DT") return 0; // simplified: only DT implemented
  const sigmaV = interp(SIGMA_V_DT, temperatureKeV); // m^3/s
  const nD = density / 2;
  const nT = density / 2;
  const reactionRate = nD * nT * sigmaV; // reactions per m^3 per s
  const power = reactionRate * FUSION_ENERGY_J.DT * volume; // Watts
  return power; // W
}

export function radiationLoss({ fusionPowerW, radLossFrac = 0.15 }) {
  return fusionPowerW * radLossFrac;
}

export function engineeringPower({
  fusionPowerW,
  wallEfficiency = 0.35,
  recircFraction = 0.15,
  heatingPowerW,
}) {
  const netThermal = fusionPowerW * wallEfficiency;
  const recirc = netThermal * recircFraction;
  const netElectric = netThermal - recirc - heatingPowerW;
  const qEng = netThermal > 0 && heatingPowerW > 0 ? netThermal / heatingPowerW : 0;
  return { netElectric, recirc, qEng };
}

export function tripleProduct({ density, temperatureKeV, confinementTime }) {
  return density * temperatureKeV * confinementTime;
}

export function evaluateScenario(params) {
  const {
    fuel,
    density,
    temperatureKeV,
    confinementTime,
    plasmaVolume,
    heatingPowerMW,
    wallEfficiency,
    recircFraction,
    radLossFrac,
  } = params;

  const heatingPowerW = heatingPowerMW * 1e6;
  const pfus = fusionPower({
    fuel,
    density,
    temperatureKeV,
    volume: plasmaVolume,
  });
  const prad = radiationLoss({ fusionPowerW: pfus, radLossFrac });
  const qPlasma = heatingPowerW > 0 ? pfus / heatingPowerW : 0;
  const { netElectric, recirc, qEng } = engineeringPower({
    fusionPowerW: pfus - prad,
    wallEfficiency,
    recircFraction,
    heatingPowerW,
  });
  const triple = tripleProduct({ density, temperatureKeV, confinementTime });
  const lawsonProgress = Math.min(1, triple / LAWSON_TARGET);

  return {
    pfus,
    prad,
    qPlasma,
    netElectric,
    recirc,
    qEng,
    triple,
    lawsonProgress,
  };
}
