/**
 * Editor Top Bar
 * File operations, undo/redo, and main actions
 */

import { Undo, Redo, Download, Upload } from 'lucide-react';

const TopBar = ({ onImport, onExport, onUndo, onRedo, canUndo, canRedo, asset }) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-cyan-400">Asset Editor</h1>
        {asset && (
          <span className="text-sm text-slate-400">
            {asset.name || 'Untitled'}
          </span>
        )}
      </div>

      {/* Center: Main Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => document.getElementById('file-import-trigger')?.click()}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-sm transition-colors"
          title="Import Asset"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 border border-slate-700 rounded transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 border border-slate-700 rounded transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
        </button>

        <button
          onClick={onExport}
          disabled={!asset}
          className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 rounded text-sm transition-colors"
          title="Export Asset"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Right: Help/Info */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Funktopia Editor v1.0</span>
      </div>
    </div>
  );
};

export default TopBar;
