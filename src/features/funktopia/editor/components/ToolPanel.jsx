/**
 * Tool Panel
 * Left sidebar with editing tools
 */

import {
  MousePointer,
  Paintbrush,
  Box,
  Scissors,
  Sliders,
} from 'lucide-react';

const TOOLS = [
  { id: 'select', name: 'Select', icon: MousePointer, hotkey: 'V' },
  { id: 'paint', name: 'Paint', icon: Paintbrush, hotkey: 'B' },
  { id: 'transform', name: 'Transform', icon: Box, hotkey: 'T' },
  { id: 'boolean', name: 'Boolean', icon: Scissors, hotkey: 'Shift+B' },
  { id: 'material', name: 'Material', icon: Sliders, hotkey: 'M' },
];

const ToolPanel = ({ activeTool, onSelectTool }) => {
  return (
    <div className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-2">
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <button
            key={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
              isActive
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
            title={`${tool.name} (${tool.hotkey})`}
          >
            <Icon className="w-6 h-6" />
          </button>
        );
      })}
    </div>
  );
};

export default ToolPanel;
