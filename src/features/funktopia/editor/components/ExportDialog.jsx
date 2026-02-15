/**
 * Export Dialog
 * Export options for edited assets
 */

import { useState } from 'react';
import { Download, X } from 'lucide-react';

const ExportDialog = ({ asset, onExport, onClose }) => {
  const [exportFormat, setExportFormat] = useState('glb');
  const [customFilename, setCustomFilename] = useState('');

  const defaultFilename = asset?.source?.split('.')[0] || 'edited-asset';

  const handleExport = () => {
    const filename = customFilename || defaultFilename;
    onExport(exportFormat, filename);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-slate-800 rounded transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold text-cyan-400 mb-6">Export Asset</h2>

        {/* Format selector */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Format</label>
            <div className="flex gap-2">
              {[
                { value: 'glb', label: 'GLB', desc: 'Binary (recommended)' },
                { value: 'gltf', label: 'glTF', desc: 'JSON' },
                { value: 'obj', label: 'OBJ', desc: 'Universal' },
              ].map((format) => (
                <button
                  key={format.value}
                  onClick={() => setExportFormat(format.value)}
                  className={`flex-1 px-3 py-2 rounded border transition-colors ${
                    exportFormat === format.value
                      ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                      : 'border-slate-700 bg-slate-800/70 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={format.desc}
                >
                  {format.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Filename (optional)</label>
            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder={defaultFilename}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded transition-colors"
          >
            <Download className="w-4 h-4" />
            Export as {exportFormat.toUpperCase()}
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-400 space-y-1">
          <p>• GLB: Best for web/game engines</p>
          <p>• glTF: Human-readable JSON</p>
          <p>• OBJ: Universal compatibility</p>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
