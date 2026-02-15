import { runSimulation } from "../state/simulationCore.js";

self.onmessage = (event) => {
  const { type, params, tag, runId } = event.data || {};
  if (type !== "run" || !params) return;
  const result = runSimulation(params);
  self.postMessage({ type: "result", tag, runId, ...result });
};
