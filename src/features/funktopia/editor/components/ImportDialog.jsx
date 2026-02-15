/**
 * Import Dialog
 * File upload and URL import interface
 */

import { useState } from 'react';
import { Upload, Link, X } from 'lucide-react';

const ImportDialog = ({ onImport, onClose }) => {
  const [importMode, setImportMode] = useState('file'); // 'file' or 'url'
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    const extension = file.name.split('.').pop().toLowerCase();
    if (!['glb', 'gltf', 'obj'].includes(extension)) {
      alert(`Unsupported file format: .${extension}\nSupported: GLB, glTF, OBJ`);
      return;
    }

    setIsImporting(true);
    onImport(file)
      .catch((error) => {
        alert(`Import failed: ${error.message}`);
      })
      .finally(() => {
        setIsImporting(false);
      });
  };

  const handleUrlImport = () => {
    if (!url.trim()) return;

    setIsImporting(true);
    onImport(url)
      .catch((error) => {
        alert(`Import failed: ${error.message}`);
      })
      .finally(() => {
        setIsImporting(false);
      });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
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
        <h2 className="text-xl font-semibold text-cyan-400 mb-6">Import 3D Asset</h2>

        {/* Mode selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setImportMode('file')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded border transition-colors ${
              importMode === 'file'
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            File Upload
          </button>
          <button
            onClick={() => setImportMode('url')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded border transition-colors ${
              importMode === 'url'
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Link className="w-4 h-4" />
            URL Import
          </button>
        </div>

        {/* File upload mode */}
        {importMode === 'file' && (
          <div>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-300 mb-2">Drag and drop a file here</p>
              <p className="text-sm text-slate-500 mb-4">or</p>
              <label className="inline-block px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded cursor-pointer transition-colors">
                Browse Files
                <input
                  type="file"
                  accept=".glb,.gltf,.obj"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  disabled={isImporting}
                />
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center">
              Supported formats: GLB, glTF, OBJ
            </p>
          </div>
        )}

        {/* URL import mode */}
        {importMode === 'url' && (
          <div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Asset URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/model.glb"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  disabled={isImporting}
                />
              </div>
              <button
                onClick={handleUrlImport}
                disabled={!url.trim() || isImporting}
                className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded transition-colors"
              >
                {isImporting ? 'Importing...' : 'Import from URL'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Note: The URL must be publicly accessible and CORS-enabled.
            </p>
          </div>
        )}

        {/* Loading state */}
        {isImporting && (
          <div className="absolute inset-0 bg-slate-900/80 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-slate-300">Importing asset...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportDialog;
