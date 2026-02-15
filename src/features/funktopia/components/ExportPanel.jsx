/**
 * Funktopia Export Panel
 * UI component for exporting generated 3D assets
 */

import { useState } from 'react';
import { exportGLTF, exportOBJ } from '../utils/exporters';

const ExportPanel = ({ sceneRef, params, generator }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('glb');
  const [customFilename, setCustomFilename] = useState('');

  const handleExport = async () => {
    if (!sceneRef.current) {
      console.error('No scene available for export');
      return;
    }

    setIsExporting(true);

    try {
      const filename = customFilename || generator.generateFilename();

      // Find the track mesh in the scene
      const trackGroup = sceneRef.current.children.find(
        (child) => child.type === 'Group' || child.isMesh
      );

      if (!trackGroup) {
        throw new Error('No geometry found to export');
      }

      if (exportFormat === 'glb' || exportFormat === 'gltf') {
        await exportGLTF(trackGroup, {
          binary: exportFormat === 'glb',
          filename,
        });
      } else if (exportFormat === 'obj') {
        exportOBJ(trackGroup, { filename });
      }

      console.log(`Exported as ${filename}.${exportFormat}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-slate-700 pt-4">
      <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Export</p>

      <div className="space-y-2">
        <label className="text-xs text-slate-300">Format</label>
        <div className="flex gap-2">
          {[
            { value: 'glb', label: 'GLB', desc: 'Binary (recommended)' },
            { value: 'gltf', label: 'glTF', desc: 'JSON' },
            { value: 'obj', label: 'OBJ', desc: 'Universal' },
          ].map((format) => (
            <button
              key={format.value}
              onClick={() => setExportFormat(format.value)}
              className={`flex-1 px-2 py-2 rounded text-xs border ${
                exportFormat === format.value
                  ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-700 bg-slate-800/70 text-slate-300'
              }`}
              title={format.desc}
            >
              {format.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-slate-300">Filename (optional)</label>
        <input
          type="text"
          value={customFilename}
          onChange={(e) => setCustomFilename(e.target.value)}
          placeholder={generator.generateFilename()}
          className="w-full px-3 py-2 bg-slate-800/70 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-500"
        />
      </div>

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors"
      >
        {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
      </button>

      <div className="text-xs text-slate-400 space-y-1">
        <p>• GLB: Best for web/game engines</p>
        <p>• glTF: Human-readable JSON</p>
        <p>• OBJ: Universal compatibility</p>
      </div>
    </div>
  );
};

export default ExportPanel;
