/**
 * Asset Editor Page
 * Main editor interface for importing and editing 3D assets
 */

import { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewcube } from '@react-three/drei';
import TopBar from './components/TopBar';
import ToolPanel from './components/ToolPanel';
import PropertiesPanel from './components/PropertiesPanel';
import ViewportScene from './components/ViewportScene';
import ImportDialog from './components/ImportDialog';
import ExportDialog from './components/ExportDialog';
import { importAsset, normalizeAsset, getAssetStats } from './utils/importers';
import { exportGLTF, exportOBJ } from '../utils/exporters';

const AssetEditorPage = () => {
  // Asset state
  const [asset, setAsset] = useState(null);
  const [assetStats, setAssetStats] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);

  // Tool state
  const [activeTool, setActiveTool] = useState('select');

  // UI state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Editor state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Refs
  const sceneRef = useRef();
  const canvasRef = useRef();
  const paintCanvasRef = useRef();
  const paintTextureRef = useRef();
  const paintBrushRef = useRef({
    color: '#ff6b6b',
    size: 20,
    opacity: 1,
    hardness: 0.8,
    mode: 'paint',
  });

  // Import asset handler
  const handleImportAsset = async (fileOrUrl) => {
    try {
      const importedAsset = await importAsset(fileOrUrl);

      // Normalize asset (center and scale)
      normalizeAsset(importedAsset, 10);

      // Get statistics
      const stats = getAssetStats(importedAsset);

      setAsset(importedAsset);
      setAssetStats(stats);
      setSelectedObject(null);
      setShowImportDialog(false);

      // Reset history
      setHistory([{ type: 'import', asset: importedAsset }]);
      setHistoryIndex(0);

      console.log('Asset imported:', importedAsset);
      console.log('Stats:', stats);
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  };

  // Export current asset
  const handleExport = async (format, filename) => {
    if (!asset || !asset.scene) {
      alert('No asset to export');
      return;
    }

    try {
      if (format === 'glb' || format === 'gltf') {
        await exportGLTF(asset.scene, {
          binary: format === 'glb',
          filename,
        });
      } else if (format === 'obj') {
        exportOBJ(asset.scene, { filename });
      }

      console.log(`Exported as ${filename}.${format}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    }
  };

  // Undo/Redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = () => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      // Apply history state
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      // Apply history state
    }
  };

  // Material change handler
  const handleMaterialChange = (material, materialIndex) => {
    console.log('Material updated:', materialIndex, material);
    // TODO: Add to history for undo/redo
  };

  // Texture update handler
  const handleTextureUpdate = (texture) => {
    console.log('Texture updated:', texture);
    paintTextureRef.current = texture;
    // TODO: Add to history for undo/redo
  };

  // Color sample handler (eyedropper)
  const handleColorSample = (color) => {
    console.log('Color sampled:', color);
    // Update brush color in TexturePainter via event
    const event = new CustomEvent('eyedropper-color', { detail: { color } });
    window.dispatchEvent(event);
  };

  // Update paint brush ref from TexturePainter
  useEffect(() => {
    const updateBrush = () => {
      const brushElement = document.querySelector('[data-brush]');
      if (brushElement) {
        const brushData = brushElement.getAttribute('data-brush');
        if (brushData) {
          try {
            paintBrushRef.current = JSON.parse(brushData);
          } catch (e) {
            console.error('Failed to parse brush data:', e);
          }
        }
      }
    };

    const interval = setInterval(updateBrush, 100); // Poll for brush updates
    return () => clearInterval(interval);
  }, [activeTool]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <TopBar
        onImport={() => setShowImportDialog(true)}
        onExport={() => setShowExportDialog(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        asset={asset}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <ToolPanel activeTool={activeTool} onSelectTool={setActiveTool} />

        {/* Center Viewport */}
        <div className="flex-1 relative bg-slate-900">
          {!asset ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="text-6xl">🎨</div>
                <h2 className="text-2xl font-semibold text-slate-300">Asset Editor</h2>
                <p className="text-slate-400 max-w-md">
                  Import a 3D asset to begin editing. Supported formats: GLB, glTF, OBJ.
                </p>
                <button
                  onClick={() => setShowImportDialog(true)}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
                >
                  Import Asset
                </button>
              </div>
            </div>
          ) : (
            <Canvas
              ref={canvasRef}
              shadows
              camera={{ position: [10, 10, 10], fov: 50 }}
              onCreated={({ scene }) => {
                sceneRef.current = scene;
              }}
            >
              <color attach="background" args={['#0f172a']} />
              <ambientLight intensity={0.5} />
              <directionalLight
                position={[10, 10, 10]}
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <pointLight position={[-10, -10, -10]} intensity={0.3} />

              <ViewportScene
                asset={asset}
                selectedObject={selectedObject}
                activeTool={activeTool}
                onMeshSelect={setSelectedObject}
                paintBrush={paintBrushRef.current}
                onColorSample={handleColorSample}
                paintCanvasRef={paintCanvasRef}
                paintTextureRef={paintTextureRef}
              />

              {/* Ground plane */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
                <planeGeometry args={[50, 50]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
              <gridHelper args={[50, 25, '#334155', '#1e293b']} position={[0, -1.99, 0]} />

              <OrbitControls enableDamping dampingFactor={0.05} />

              {/* Gizmo for orientation */}
              <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewcube />
              </GizmoHelper>
            </Canvas>
          )}

          {/* Viewport Overlay Info */}
          {asset && (
            <div className="absolute top-4 left-4 bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2 text-xs backdrop-blur">
              <p className="text-cyan-400 font-semibold">
                {asset.name || 'Unnamed Asset'}
              </p>
              <p className="text-slate-400">
                Tool: <span className="text-slate-200">{activeTool}</span>
              </p>
            </div>
          )}
        </div>

        {/* Right Properties Panel */}
        <PropertiesPanel
          asset={asset}
          assetStats={assetStats}
          selectedObject={selectedObject}
          activeTool={activeTool}
          onMaterialChange={handleMaterialChange}
          onTextureUpdate={handleTextureUpdate}
        />
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <ImportDialog
          onImport={handleImportAsset}
          onClose={() => setShowImportDialog(false)}
        />
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          asset={asset}
          onExport={handleExport}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
};

export default AssetEditorPage;
