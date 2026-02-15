import { FiPlus, FiTrash2, FiEye, FiEyeOff, FiRefreshCw } from "react-icons/fi";

const FunctionPanel = ({
  functions,
  onChange,
  onAdd,
  onRemove,
  onToggleVisibility,
  onResetView,
}) => {
  return (
    <aside className="w-[360px] shrink-0 border-r border-slate-800/70 bg-[#0d1428]/80 backdrop-blur-xl text-slate-100">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/70">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">
            Lit🔥 Functions
          </p>
          <p className="text-lg font-semibold">Plotting stack</p>
          <p className="text-xs text-slate-400">
            Build your set, color it, and watch the canvas react in real time.
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
          <p className="text-sm font-semibold">Functions</p>
          <p className="text-[11px] text-slate-400">
            Use x as your variable. Supports pi/e/tau, trig, log/ln/log10/log2, sqrt/cbrt,
            abs(|x|), ^ or ** for powers, min/max/clamp, and implicit multiplication like 2x or y=2x.
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

      <div className="space-y-3 px-4 pb-6">
        {functions.map((fn) => (
          <div
            key={fn.id}
            className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {fn.label}(x)
                  {!fn.visible && (
                    <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-400">
                      Hidden
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500">
                  Color + expression feed the canvas live.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={`${fn.label} color`}
                  value={fn.color}
                  onChange={(e) => onChange(fn.id, { color: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-slate-700 bg-slate-900 p-1"
                />
                <button
                  type="button"
                  onClick={() => onToggleVisibility(fn.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-900 text-slate-200 transition hover:border-cyan-400/60 hover:text-cyan-200"
                >
                  {fn.visible ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(fn.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800/70 bg-slate-900 text-slate-400 transition hover:border-rose-500/70 hover:text-rose-200"
                  aria-label={`Remove ${fn.label}`}
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
                value={fn.expression}
                onChange={(e) => onChange(fn.id, { expression: e.target.value })}
                placeholder="e.g., sin(x) + 0.5*x^2"
                className="w-full rounded-xl border border-slate-800/70 bg-[#0d1428] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/70 focus:outline-none"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="mathmadness-mono">
                  Sample: sin(x), cos(x/2)+1, e^(x), |x|, log10(100), clamp(x,-2,2)
                </span>
                {fn.error ? (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200">
                    {fn.error}
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

        {functions.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-900/40 px-4 py-5 text-center text-sm text-slate-400">
            No functions yet. Tap the green plus to start plotting.
          </div>
        )}
      </div>
    </aside>
  );
};

export default FunctionPanel;
