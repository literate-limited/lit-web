/**
 * Properties Panel
 * Right sidebar showing properties of selected object/tool
 */

import MaterialEditor from './MaterialEditor';
import TexturePainter from './TexturePainter';

const PropertiesPanel = ({ asset, assetStats, selectedObject, activeTool, onMaterialChange, onTextureUpdate }) => {
  if (!asset) {
    return (
      <div className="w-80 bg-slate-900 border-l border-slate-800 p-4">
        <p className="text-sm text-slate-500">No asset loaded</p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* Asset Info */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-cyan-400 mb-2">Asset</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Name:</span>
              <span className="text-slate-200">{asset.source || 'Unnamed'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Format:</span>
              <span className="text-slate-200">{asset.type?.toUpperCase() || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {assetStats && (
          <div>
            <h3 className="text-xs uppercase tracking-wider text-cyan-400 mb-2">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Meshes:</span>
                <span className="text-slate-200">{assetStats.meshCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Materials:</span>
                <span className="text-slate-200">{assetStats.materialCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Textures:</span>
                <span className="text-slate-200">{assetStats.textureCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vertices:</span>
                <span className="text-slate-200">{assetStats.vertexCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Triangles:</span>
                <span className="text-slate-200">{assetStats.triangleCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dimensions:</span>
                <span className="text-slate-200 text-xs">
                  {assetStats.size.x.toFixed(1)} × {assetStats.size.y.toFixed(1)} × {assetStats.size.z.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tool-specific properties */}
        <div>
          <h3 className="text-xs uppercase tracking-wider text-cyan-400 mb-2">
            {activeTool} Tool
          </h3>

          {activeTool === 'material' ? (
            <MaterialEditor
              asset={asset}
              selectedMesh={selectedObject}
              onMaterialChange={onMaterialChange}
            />
          ) : activeTool === 'paint' ? (
            <TexturePainter
              asset={asset}
              selectedMesh={selectedObject}
              onTextureUpdate={onTextureUpdate}
            />
          ) : (
            <div className="text-sm text-slate-400">
              {activeTool === 'select' && <p>Select objects in the scene to edit them.</p>}
              {activeTool === 'transform' && <p>Move, rotate, or scale the selected object. (Coming soon)</p>}
              {activeTool === 'boolean' && <p>Combine or subtract meshes. (Coming soon)</p>}
            </div>
          )}
        </div>

        {/* Selection Info */}
        {selectedObject ? (
          <div>
            <h3 className="text-xs uppercase tracking-wider text-cyan-400 mb-2">Selection</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
                <span className="text-slate-200">{selectedObject.type}</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-slate-500">No object selected</p>
          </div>
        )}

        {/* Placeholder for future tool properties */}
        <div className="pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">
            Tool-specific properties will appear here once implemented.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
