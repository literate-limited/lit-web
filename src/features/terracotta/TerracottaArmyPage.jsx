import TerracottaArmyCanvas from "./TerracottaArmyCanvas";

const TerracottaArmyPage = () => {
  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[720px] flex-col overflow-hidden rounded-l-3xl bg-gradient-to-br from-[#04060e] via-[#080b16] to-[#0b1224] text-slate-100">
      <div className="flex items-center justify-between gap-4 border-b border-slate-800/60 px-6 py-5">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.35em] text-amber-300/80">
            Terracotta
          </p>
          <h1 className="text-2xl font-semibold text-slate-50">Terracotta Army</h1>
          <p className="max-w-3xl text-sm text-slate-300">
            A stylized phalanx of digital Terracotta soldiers, rendered in three.js. Orbit, zoom,
            and inspect the ranks; drop the exported GLB into other Lit worlds.
          </p>
        </div>
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs text-amber-100 shadow-lg shadow-amber-500/10">
          Built with react-three-fiber · Instanced meshes for performance
        </div>
      </div>

      <div className="relative flex-1">
        <TerracottaArmyCanvas />
        <div className="pointer-events-none absolute left-6 bottom-6 rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-xs text-slate-200 shadow-lg shadow-slate-900/60 backdrop-blur">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Controls</p>
          <p className="mathmadness-mono text-sm">
            Drag to orbit · Scroll to zoom · Right-click to pan
          </p>
        </div>
      </div>
    </div>
  );
};

export default TerracottaArmyPage;
