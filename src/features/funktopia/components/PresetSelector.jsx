/**
 * Preset Selector Component
 * Shows and applies generator-specific presets
 */

const PresetSelector = ({ generator, currentPresetId, onApplyPreset }) => {
  const presets = generator.getPresets();

  if (presets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-300">Presets</p>
      <div className="flex flex-col gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onApplyPreset(preset.id, preset.params)}
            className={`text-left px-3 py-2 rounded-lg border ${
              currentPresetId === preset.id
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-slate-700 bg-slate-800/70'
            }`}
          >
            <div className="font-semibold text-sm">{preset.name}</div>
            <div className="text-xs text-slate-400">{preset.note}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PresetSelector;
