import {
  FiPlus,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiDownloadCloud,
  FiBox,
} from "react-icons/fi";

const Slider = ({ label, min, max, step, value, onChange, suffix, helper }) => (
  <label className="block rounded-xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 shadow-inner shadow-cyan-500/10">
    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-slate-400">
      <span>{label}</span>
      <span className="text-sm font-semibold text-slate-100 tracking-normal">
        {value} {suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="mt-3 h-2 w-full cursor-pointer accent-cyan-400"
      aria-label={label}
    />
    {helper ? <p className="mt-2 text-xs text-slate-500">{helper}</p> : null}
  </label>
);

const SurfacePanel = ({
  surfaces,
  settings,
  exportState,
  onSurfaceChange,
  onAdd,
  onRemove,
  onToggleVisibility,
  onResetView,
  onSettingsChange,
  onExport,
}) => {
  return (
    <aside className="w-[380px] shrink-0 border-r border-slate-800/70 bg-[#0d1428]/80 backdrop-blur-xl text-slate-100">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/70">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">
            Lit🔥 Functions
          </p>
          <p className="text-lg font-semibold">3D Surface Lab</p>
          <p className="text-xs text-slate-400">
            Plot z = f(x, y) as geometry, tune the field, and export a GLB asset.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetView}
          className="group inline-flex h-10 items-center gap-2 rounded-full border border-slate-700/60 px-3 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/70 hover:text-cyan-200"
        >
          <FiRefreshCw className="h-4 w-4 transition group-hover:rotate-90" />
          Reset view
        </button>
      </div>

      <div className="flex items-center justify-between px-5 py-3">
        <div>
          <p className="text-sm font-semibold">Surfaces</p>
          <p className="text-[11px] text-slate-400">
            Use x and y as variables. Supports pi/e/tau, trig, log, abs(|x|), powers (^ or **),
            min/max/clamp, and implicit multiplication like 2xy or z=2xy.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/90 to-emerald-400/90 text-slate-900 shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
        >
          <FiPlus size={18} />
        </button>
      </div>

      <div className="px-5 space-y-3 pb-4">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-inner shadow-cyan-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <FiBox className="text-cyan-300" />
              Field and export
            </div>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-3 py-2 text-xs font-semibold text-slate-900 shadow-lg shadow-cyan-500/30 transition active:scale-[0.98]"
            >
              <FiDownloadCloud size={14} />
              Export GLB
            </button>
          </div>
          <div className="mt-3 grid gap-3">
            <Slider
              label="Domain size"
              min={4}
              max={20}
              step={1}
              value={settings.size}
              suffix="units"
              helper="Grid spans -size/2 to +size/2."
              onChange={(value) => onSettingsChange({ size: value })}
            />
            <Slider
              label="Resolution"
              min={12}
              max={180}
              step={4}
              value={settings.resolution}
              suffix="steps"
              helper="Higher resolution yields smoother meshes and larger files."
              onChange={(value) => onSettingsChange({ resolution: value })}
            />
            <Slider
              label="Height scale"
              min={0.25}
              max={4}
              step={0.05}
              value={Number(settings.heightScale.toFixed(2))}
              suffix="×"
              helper="Amplify or calm z to keep shapes printable."
              onChange={(value) => onSettingsChange({ heightScale: value })}
            />
            <div className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/60 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-slate-100">Wireframe</p>
                <p className="text-[11px] text-slate-500">
                  Toggle triangle outlines for debugging.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSettingsChange({ wireframe: !settings.wireframe })}
                className={[
                  "flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold transition",
                  settings.wireframe
                    ? "bg-cyan-400/20 text-cyan-200 ring-1 ring-cyan-400/50"
                    : "bg-slate-800/70 text-slate-200 hover:bg-slate-800",
                ].join(" ")}
              >
                {settings.wireframe ? "On" : "Off"}
              </button>
            </div>
            {exportState?.status && (
              <div
                className={[
                  "rounded-xl border px-3 py-2 text-[11px] uppercase tracking-[0.2em]",
                  exportState.status === "error"
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                    : exportState.status === "working"
                      ? "border-amber-400/40 bg-amber-400/10 text-amber-100"
                      : "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
                ].join(" ")}
              >
                {exportState.message}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 pb-6">
        {surfaces.map((surface) => (
          <div
            key={surface.id}
            className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {surface.label}(x, y)
                  {!surface.visible && (
                    <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-400">
                      Hidden
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500">
                  Color + expression drive the surface.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={`${surface.label} color`}
                  value={surface.color}
                  onChange={(e) => onSurfaceChange(surface.id, { color: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-slate-700 bg-slate-900 p-1"
                />
                <button
                  type="button"
                  onClick={() => onToggleVisibility(surface.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-900 text-slate-200 transition hover:border-cyan-400/60 hover:text-cyan-200"
                >
                  {surface.visible ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(surface.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800/70 bg-slate-900 text-slate-400 transition hover:border-rose-500/70 hover:text-rose-200"
                  aria-label={`Remove ${surface.label}`}
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <label className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                Expression
              </label>
              <input
                type="text"
                value={surface.expression}
                onChange={(e) => onSurfaceChange(surface.id, { expression: e.target.value })}
                placeholder="e.g., sin(x)*cos(y) + 0.5*(x^2 - y^2)"
                className="w-full rounded-xl border border-slate-800/70 bg-[#0d1428] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/70 focus:outline-none"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="mathmadness-mono">
                  Sample: sin(x)*cos(y), 0.2*(x^2 - y^2), log(hypot(x,y)), clamp(x*y,-2,2)
                </span>
                {surface.error ? (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200">
                    {surface.error}
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-200">
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {surfaces.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-900/40 px-4 py-5 text-center text-sm text-slate-400">
            No surfaces yet. Tap the green plus to start sculpting.
          </div>
        )}
      </div>
    </aside>
  );
};

export default SurfacePanel;
