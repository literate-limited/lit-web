/**
 * Generator Selector Component
 * Allows users to switch between different geometry generators
 */

import { CoasterGenerator } from '../generators/CoasterGenerator';
import { SurfaceGenerator } from '../generators/SurfaceGenerator';
import { PrimitiveGenerator } from '../generators/PrimitiveGenerator';

const GENERATORS = [
  { id: 'coaster', class: CoasterGenerator, icon: '🎢', color: 'orange' },
  { id: 'surface', class: SurfaceGenerator, icon: '📊', color: 'blue' },
  { id: 'primitive', class: PrimitiveGenerator, icon: '🔮', color: 'purple' },
];

const GeneratorSelector = ({ currentGeneratorId, onSelectGenerator }) => {
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-300">Generator Type</p>
      <div className="flex gap-2">
        {GENERATORS.map((gen) => (
          <button
            key={gen.id}
            onClick={() => onSelectGenerator(gen.id)}
            className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
              currentGeneratorId === gen.id
                ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:border-slate-600'
            }`}
            title={new gen.class().description}
          >
            <div className="text-xl mb-1">{gen.icon}</div>
            <div className="text-xs font-semibold">{new gen.class().name}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GeneratorSelector;
export { GENERATORS };
