// Memoized selectors for Hearts on Fire state to reduce rerenders.

export const selectParams = (state) => state.params;
export const selectOutputs = (state) => state.outputs;
export const selectCurves = (state) => state.curves;
export const selectStatus = (state) => state.status;
export const selectBaseline = (state) => state.baseline;
export const selectPresetId = (state) => state.presetId;
export const selectFlags = (state) => ({
  reducedMotion: state.reducedMotion,
  colorBlindSafe: state.colorBlindSafe,
});

export const selectSaturationColorInput = (state) => ({
  saO2: state.outputs.saO2,
  colorBlindSafe: state.colorBlindSafe,
});
