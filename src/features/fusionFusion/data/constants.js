// Simplified constants and lookup tables for Fusion Fusion (educational only)

export const FUSION_ENERGY_J = {
  DT: 17.6 * 1.602e-13, // joules per reaction
  DD: 3.6 * 1.602e-13,  // averaged branch
};

// Rough <sigma v> (m^3/s) vs temperature (keV) for D-T, coarse and smoothed.
// Values are intentionally simplified for educational use.
export const SIGMA_V_DT = [
  { T: 5, value: 1e-23 },
  { T: 10, value: 5e-22 },
  { T: 14, value: 1.1e-21 },
  { T: 20, value: 1.6e-21 },
  { T: 25, value: 1.8e-21 },
  { T: 30, value: 1.9e-21 },
  { T: 40, value: 1.95e-21 },
  { T: 50, value: 1.9e-21 },
];

// Tokamak and ICF preset bounds
export const PRESETS = {
  tokamak: {
    label: "Tokamak",
    temperatureKeV: 12,
    density: 1e20,
    confinementTime: 1.0, // seconds
    magneticField: 5, // Tesla
    plasmaVolume: 100, // m^3
    heatingPower: 50, // MW
  },
  icf: {
    label: "ICF (laser)",
    temperatureKeV: 10,
    density: 1e26,
    confinementTime: 1e-8, // seconds
    magneticField: 0,
    plasmaVolume: 0.0001, // m^3
    heatingPower: 200, // MW (equiv beam energy / pulse window)
  },
};

export const LESSONS = [
  {
    title: "The Lawson Criterion",
    body:
      "For D-T, you need the triple product n·T·τ above ~1×10²¹ keV·s·m⁻³. Raise temperature, density, or confinement to push the meter past breakeven.",
  },
  {
    title: "Q_plasma vs Q_engineering",
    body:
      "Q_plasma looks only at fusion power vs heating. Engineering Q also accounts for wall/blanket efficiency and recirculating power—you need both to go net electric.",
  },
  {
    title: "Radiation and Recirc Losses",
    body:
      "Bremsstrahlung and synchrotron losses steal power; higher Z or impurities worsen them. Recirculating power covers pumps, cryo, magnets, lasers—keep it low.",
  },
  {
    title: "Fuel Choice",
    body:
      "D-T burns easiest but needs tritium breeding. D-D is harder (lower cross-section, more losses). Try switching fuel to see how Q drops.",
  },
  {
    title: "Why Materials Matter",
    body:
      "High wall loading and neutron flux limit how hot/long you can run. In reality, materials and maintenance drive costs—here we approximate with wall efficiency.",
  },
];

export const LAWSON_TARGET = 1e21; // keV·s·m^-3 target for D-T
export const MAX_TEMP_KEV = 50;
export const MIN_TEMP_KEV = 2;
