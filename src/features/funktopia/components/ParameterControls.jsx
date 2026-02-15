/**
 * Parameter Controls Component
 * Dynamic parameter UI based on generator configuration
 */

const ParameterControls = ({ generator, params, onUpdateParam }) => {
  const config = generator.getParameterConfig();

  return (
    <div className="space-y-3">
      {config.map((param) => {
        if (param.type === 'slider') {
          return (
            <div key={param.key} className="flex flex-col gap-1">
              <label className="text-xs text-slate-300">
                {param.label}: <span className="text-cyan-300">{params[param.key]}</span>
              </label>
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={params[param.key]}
                onChange={(e) => onUpdateParam(param.key, Number(e.target.value))}
                className="w-full"
              />
            </div>
          );
        }

        if (param.type === 'select') {
          return (
            <div key={param.key} className="flex flex-col gap-1">
              <label className="text-xs text-slate-300">{param.label}</label>
              <select
                value={params[param.key]}
                onChange={(e) => onUpdateParam(param.key, e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/70 border border-slate-700 rounded text-sm text-slate-100"
              >
                {param.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default ParameterControls;
