import { useMemo, useRef, useState } from "react";
import SurfacePanel from "../components/SurfacePanel";
import SurfaceCanvas from "../components/SurfaceCanvas";
import { compileExpression } from "../utils/expressionParser";

const makeId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `surf-${Math.random().toString(16).slice(2)}`;

const defaultSurfaces = [
  { id: "surf-1", label: "z1", expression: "sin(x)*cos(y)", color: "#22d3ee", visible: true },
  { id: "surf-2", label: "z2", expression: "0.2*(x^2 - y^2)", color: "#a855f7", visible: false },
];

const defaultSettings = {
  size: 10,
  resolution: 96,
  heightScale: 1,
  wireframe: false,
};

const compileSurface = (surface) => {
  const { evaluator, error } = compileExpression(surface.expression, { variables: ["x", "y"] });
  if (!evaluator) {
    return { ...surface, evaluator: null, error: error ?? "Enter expression" };
  }
  return { ...surface, evaluator, error: null };
};

const LitFunctions3DPage = () => {
  const [surfaces, setSurfaces] = useState(defaultSurfaces);
  const [settings, setSettings] = useState(defaultSettings);
  const [exportState, setExportState] = useState({ status: "", message: "" });
  const stageRef = useRef(null);

  const compiledSurfaces = useMemo(
    () => surfaces.map((surface) => compileSurface(surface)),
    [surfaces]
  );

  const updateSurface = (id, patch) => {
    setSurfaces((list) => list.map((surface) => (surface.id === id ? { ...surface, ...patch } : surface)));
  };

  const addSurface = () => {
    setSurfaces((list) => {
      const index = list.length + 1;
      return [
        ...list,
        {
          id: makeId(),
          label: `z${index}`,
          expression: "cos(x*y/2)",
          color: "#10b981",
          visible: true,
        },
      ];
    });
  };

  const removeSurface = (id) => {
    setSurfaces((list) => list.filter((surface) => surface.id !== id));
  };

  const toggleVisibility = (id) => {
    setSurfaces((list) =>
      list.map((surface) =>
        surface.id === id ? { ...surface, visible: !surface.visible } : surface
      )
    );
  };

  const resetView = () => {
    setSettings(defaultSettings);
    stageRef.current?.resetCamera();
  };

  const updateSettings = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleExport = async () => {
    if (!stageRef.current?.exportGlb) {
      setExportState({ status: "error", message: "Surface not ready" });
      return;
    }
    try {
      setExportState({ status: "working", message: "Building GLB..." });
      const blob = await stageRef.current.exportGlb();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "lit-surface.glb";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setExportState({ status: "done", message: "Exported lit-surface.glb" });
    } catch (err) {
      setExportState({ status: "error", message: err?.message || "Export failed" });
    }
  };

  const visibleCount = compiledSurfaces.filter((surface) => surface.visible && surface.evaluator).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[720px] overflow-hidden rounded-l-3xl">
      <SurfacePanel
        surfaces={compiledSurfaces}
        settings={settings}
        exportState={exportState}
        onSurfaceChange={updateSurface}
        onAdd={addSurface}
        onRemove={removeSurface}
        onToggleVisibility={toggleVisibility}
        onResetView={resetView}
        onSettingsChange={updateSettings}
        onExport={handleExport}
      />

      <div className="relative flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-[#060b18] via-[#060f1d] to-[#050c1b]" />
        <div className="absolute inset-0">
          <SurfaceCanvas
            ref={stageRef}
            surfaces={compiledSurfaces}
            size={settings.size}
            resolution={settings.resolution}
            heightScale={settings.heightScale}
            wireframe={settings.wireframe}
          />
        </div>

        <div className="pointer-events-none absolute left-6 bottom-6 rounded-2xl border border-cyan-400/30 bg-slate-900/70 px-4 py-3 text-xs text-slate-100 shadow-lg shadow-cyan-500/10 backdrop-blur">
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">
            3D Lit Functions
          </p>
          <p className="mathmadness-mono">
            Size {settings.size} · Res {settings.resolution} · Height {settings.heightScale.toFixed(2)}× · {visibleCount} live
          </p>
          <p className="text-[11px] text-slate-400">
            Sculpt a surface → export GLB → drop into the asset pipeline.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LitFunctions3DPage;
