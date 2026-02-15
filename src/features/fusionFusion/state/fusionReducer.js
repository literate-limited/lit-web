import { PRESETS } from "../data/constants";
import { evaluateScenario } from "../utils/calculations";

export const initialState = {
  mode: "tokamak",
  fuel: "DT",
  temperatureKeV: PRESETS.tokamak.temperatureKeV,
  density: PRESETS.tokamak.density,
  confinementTime: PRESETS.tokamak.confinementTime,
  plasmaVolume: PRESETS.tokamak.plasmaVolume,
  magneticField: PRESETS.tokamak.magneticField,
  heatingPowerMW: PRESETS.tokamak.heatingPower,
  wallEfficiency: 0.35,
  recircFraction: 0.15,
  radLossFrac: 0.15,
  lessonIndex: 0,
  analysis: null,
};

export function fusionReducer(state, action) {
  switch (action.type) {
    case "SET_MODE": {
      const preset = PRESETS[action.mode] || PRESETS.tokamak;
      return {
        ...state,
        mode: action.mode,
        temperatureKeV: preset.temperatureKeV,
        density: preset.density,
        confinementTime: preset.confinementTime,
        plasmaVolume: preset.plasmaVolume,
        magneticField: preset.magneticField,
        heatingPowerMW: preset.heatingPower,
      };
    }
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "NEXT_LESSON":
      return { ...state, lessonIndex: state.lessonIndex + 1 };
    case "PREV_LESSON":
      return { ...state, lessonIndex: Math.max(0, state.lessonIndex - 1) };
    case "RUN":
      return { ...state, analysis: evaluateScenario(state) };
    default:
      return state;
  }
}
