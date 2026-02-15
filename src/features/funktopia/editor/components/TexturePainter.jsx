/**
 * Texture Painter
 * Paint textures directly on 3D models
 */

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Paintbrush, Eraser, Droplet, Trash2 } from 'lucide-react';
import { createPaintCanvas, fillCanvas } from '../utils/paintCanvas';

const TexturePainter = ({ asset, selectedMesh, onTextureUpdate }) => {
  // Brush state
  const [brushMode, setBrushMode] = useState('paint'); // paint, erase, eyedropper
  const [brushColor, setBrushColor] = useState('#ff6b6b');
  const [brushSize, setBrushSize] = useState(20);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [brushHardness, setBrushHardness] = useState(0.8);

  // Channel state
  const [activeChannel, setActiveChannel] = useState('albedo'); // albedo, roughness, metalness

  // Canvas state
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const textureRef = useRef(null);

  // Listen for eyedropper color
  useEffect(() => {
    const handleEyedropperColor = (event) => {
      if (event.detail && event.detail.color) {
        setBrushColor(event.detail.color);
      }
    };

    window.addEventListener('eyedropper-color', handleEyedropperColor);
    return () => window.removeEventListener('eyedropper-color', handleEyedropperColor);
  }, []);

  // Initialize paint canvas when mesh selected
  useEffect(() => {
    if (!selectedMesh) return;

    // Create paint canvas
    const { canvas, ctx } = createPaintCanvas(2048, 2048, '#808080');
    canvasRef.current = canvas;
    ctxRef.current = ctx;

    // Check if mesh already has a painted texture
    const material = Array.isArray(selectedMesh.material)
      ? selectedMesh.material[0]
      : selectedMesh.material;

    if (material && material.map && material.map.isCanvasTexture) {
      // Already has painted texture, use it
      canvasRef.current = material.map.image;
      ctxRef.current = canvasRef.current.getContext('2d');
      textureRef.current = material.map;
    } else {
      // Create new texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      textureRef.current = texture;

      // Apply to material
      if (material) {
        material.map = texture;
        material.needsUpdate = true;
      }
    }

    console.log('Paint canvas initialized for mesh:', selectedMesh);

    // Notify parent of canvas/texture refs
    if (onTextureUpdate && textureRef.current) {
      onTextureUpdate(textureRef.current);
    }
  }, [selectedMesh, onTextureUpdate]);

  // Get current brush properties
  const getBrush = () => ({
    color: brushColor,
    size: brushSize,
    opacity: brushOpacity,
    hardness: brushHardness,
    mode: brushMode,
  });

  // Handle fill canvas
  const handleFillCanvas = () => {
    if (!ctxRef.current) return;
    fillCanvas(ctxRef.current, brushColor);
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
    if (onTextureUpdate) {
      onTextureUpdate(textureRef.current);
    }
  };

  // Handle clear canvas
  const handleClearCanvas = () => {
    if (!ctxRef.current) return;
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    fillCanvas(ctxRef.current, '#808080');
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
    if (onTextureUpdate) {
      onTextureUpdate(textureRef.current);
    }
  };

  if (!selectedMesh) {
    return (
      <div className="p-4 text-sm text-slate-500">
        Select a mesh in the viewport to start painting.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Brush Mode */}
      <div>
        <label className="block text-xs text-slate-300 mb-2">Tool</label>
        <div className="flex gap-2">
          <button
            onClick={() => setBrushMode('paint')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border transition-colors ${
              brushMode === 'paint'
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            Paint
          </button>
          <button
            onClick={() => setBrushMode('erase')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border transition-colors ${
              brushMode === 'erase'
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Eraser className="w-4 h-4" />
            Erase
          </button>
          <button
            onClick={() => setBrushMode('eyedropper')}
            className={`px-3 py-2 rounded border transition-colors ${
              brushMode === 'eyedropper'
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Eyedropper (sample color)"
          >
            <Droplet className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Channel Selection */}
      <div>
        <label className="block text-xs text-slate-300 mb-2">Paint Channel</label>
        <select
          value={activeChannel}
          onChange={(e) => setActiveChannel(e.target.value)}
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100"
        >
          <option value="albedo">Albedo (Base Color)</option>
          <option value="roughness" disabled>Roughness (Coming soon)</option>
          <option value="metalness" disabled>Metalness (Coming soon)</option>
          <option value="normal" disabled>Normal (Coming soon)</option>
        </select>
      </div>

      {/* Brush Color */}
      <div>
        <label className="block text-xs text-slate-300 mb-2">Brush Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="w-16 h-10 rounded border border-slate-700 bg-slate-800 cursor-pointer"
          />
          <input
            type="text"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100"
          />
        </div>
      </div>

      {/* Brush Size */}
      <div>
        <label className="block text-xs text-slate-300 mb-2">
          Brush Size: <span className="text-cyan-300">{brushSize}px</span>
        </label>
        <input
          type="range"
          min="1"
          max="100"
          step="1"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Brush Opacity */}
      <div>
        <label className="block text-xs text-slate-300 mb-2">
          Opacity: <span className="text-cyan-300">{Math.round(brushOpacity * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={brushOpacity}
          onChange={(e) => setBrushOpacity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Brush Hardness */}
      <div>
        <label className="block text-xs text-slate-300 mb-2">
          Hardness: <span className="text-cyan-300">{Math.round(brushHardness * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={brushHardness}
          onChange={(e) => setBrushHardness(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <button
          onClick={handleFillCanvas}
          className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-sm transition-colors"
        >
          Fill with Color
        </button>
        <button
          onClick={handleClearCanvas}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-sm transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear Canvas
        </button>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">Shortcuts:</p>
        <p>• B: Paint brush</p>
        <p>• E: Eraser</p>
        <p>• I: Eyedropper</p>
        <p>• [ / ]: Decrease/increase size</p>
        <p>• Click & drag on mesh to paint</p>
      </div>

      {/* Export brush settings for painting interaction */}
      <div className="hidden" data-brush={JSON.stringify(getBrush())} />
    </div>
  );
};

export default TexturePainter;
