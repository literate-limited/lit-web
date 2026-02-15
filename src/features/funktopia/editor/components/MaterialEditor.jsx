/**
 * Material Editor
 * Edit PBR material properties on selected mesh
 */

import { useState, useEffect } from 'react';
import * as THREE from 'three';

const MATERIAL_PRESETS = [
  {
    id: 'default',
    name: 'Default',
    props: { color: '#808080', metalness: 0.5, roughness: 0.5, emissive: '#000000', emissiveIntensity: 0 },
  },
  {
    id: 'gold',
    name: 'Gold',
    props: { color: '#ffd700', metalness: 1, roughness: 0.2, emissive: '#000000', emissiveIntensity: 0 },
  },
  {
    id: 'silver',
    name: 'Silver',
    props: { color: '#c0c0c0', metalness: 1, roughness: 0.1, emissive: '#000000', emissiveIntensity: 0 },
  },
  {
    id: 'copper',
    name: 'Copper',
    props: { color: '#b87333', metalness: 1, roughness: 0.3, emissive: '#000000', emissiveIntensity: 0 },
  },
  {
    id: 'plastic-red',
    name: 'Plastic (Red)',
    props: { color: '#ff0000', metalness: 0, roughness: 0.4, emissive: '#000000', emissiveIntensity: 0 },
  },
  {
    id: 'plastic-blue',
    name: 'Plastic (Blue)',
    props: { color: '#0066ff', metalness: 0, roughness: 0.4, emissive: '#000000', emissiveIntensity: 0 },
  },
  {
    id: 'rubber',
    name: 'Rubber',
    props: { color: '#2a2a2a', metalness: 0, roughness: 0.9, emissive: '#000000', emissiveIntensity: 0 },
  },
  {
    id: 'glass',
    name: 'Glass',
    props: { color: '#ffffff', metalness: 0, roughness: 0, emissive: '#000000', emissiveIntensity: 0, transparent: true, opacity: 0.3 },
  },
  {
    id: 'neon',
    name: 'Neon',
    props: { color: '#00ffff', metalness: 0, roughness: 0.2, emissive: '#00ffff', emissiveIntensity: 1 },
  },
];

const MaterialEditor = ({ asset, selectedMesh, onMaterialChange }) => {
  const [materialProps, setMaterialProps] = useState({
    color: '#808080',
    metalness: 0.5,
    roughness: 0.5,
    emissive: '#000000',
    emissiveIntensity: 0,
    transparent: false,
    opacity: 1,
  });

  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);
  const [materials, setMaterials] = useState([]);

  // Extract materials from selected mesh or asset
  useEffect(() => {
    if (selectedMesh && selectedMesh.material) {
      const mats = Array.isArray(selectedMesh.material) ? selectedMesh.material : [selectedMesh.material];
      setMaterials(mats);
      setSelectedMaterialIndex(0);
      loadMaterialProps(mats[0]);
    } else if (asset && asset.materials && asset.materials.length > 0) {
      setMaterials(asset.materials);
      setSelectedMaterialIndex(0);
      loadMaterialProps(asset.materials[0]);
    }
  }, [selectedMesh, asset]);

  const loadMaterialProps = (material) => {
    if (!material) return;

    setMaterialProps({
      color: material.color ? '#' + material.color.getHexString() : '#808080',
      metalness: material.metalness !== undefined ? material.metalness : 0.5,
      roughness: material.roughness !== undefined ? material.roughness : 0.5,
      emissive: material.emissive ? '#' + material.emissive.getHexString() : '#000000',
      emissiveIntensity: material.emissiveIntensity !== undefined ? material.emissiveIntensity : 0,
      transparent: material.transparent || false,
      opacity: material.opacity !== undefined ? material.opacity : 1,
    });
  };

  const updateMaterial = (updates) => {
    const newProps = { ...materialProps, ...updates };
    setMaterialProps(newProps);

    const currentMaterial = materials[selectedMaterialIndex];
    if (currentMaterial) {
      // Apply updates to Three.js material
      if (updates.color !== undefined) {
        currentMaterial.color = new THREE.Color(updates.color);
      }
      if (updates.metalness !== undefined) {
        currentMaterial.metalness = updates.metalness;
      }
      if (updates.roughness !== undefined) {
        currentMaterial.roughness = updates.roughness;
      }
      if (updates.emissive !== undefined) {
        currentMaterial.emissive = new THREE.Color(updates.emissive);
      }
      if (updates.emissiveIntensity !== undefined) {
        currentMaterial.emissiveIntensity = updates.emissiveIntensity;
      }
      if (updates.transparent !== undefined) {
        currentMaterial.transparent = updates.transparent;
      }
      if (updates.opacity !== undefined) {
        currentMaterial.opacity = updates.opacity;
      }

      currentMaterial.needsUpdate = true;

      if (onMaterialChange) {
        onMaterialChange(currentMaterial, selectedMaterialIndex);
      }
    }
  };

  const applyPreset = (preset) => {
    updateMaterial(preset.props);
  };

  if (materials.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-500">
        No materials found. Import an asset to edit materials.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Material selector */}
      {materials.length > 1 && (
        <div>
          <label className="block text-xs text-slate-300 mb-2">Material Slot</label>
          <select
            value={selectedMaterialIndex}
            onChange={(e) => {
              const index = Number(e.target.value);
              setSelectedMaterialIndex(index);
              loadMaterialProps(materials[index]);
            }}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100"
          >
            {materials.map((mat, i) => (
              <option key={i} value={i}>
                Material {i + 1} {mat.name ? `(${mat.name})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Presets */}
      <div>
        <label className="block text-xs text-slate-300 mb-2">Presets</label>
        <div className="grid grid-cols-2 gap-2">
          {MATERIAL_PRESETS.slice(0, 6).map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
        <details className="mt-2">
          <summary className="text-xs text-cyan-400 cursor-pointer hover:text-cyan-300">
            More presets...
          </summary>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {MATERIAL_PRESETS.slice(6).map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </details>
      </div>

      {/* Base Color */}
      <div>
        <label className="block text-xs text-slate-300 mb-2">Base Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={materialProps.color}
            onChange={(e) => updateMaterial({ color: e.target.value })}
            className="w-16 h-10 rounded border border-slate-700 bg-slate-800 cursor-pointer"
          />
          <input
            type="text"
            value={materialProps.color}
            onChange={(e) => updateMaterial({ color: e.target.value })}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100"
          />
        </div>
      </div>

      {/* Metalness */}
      <div>
        <label className="block text-xs text-slate-300 mb-2">
          Metalness: <span className="text-cyan-300">{materialProps.metalness.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={materialProps.metalness}
          onChange={(e) => updateMaterial({ metalness: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Roughness */}
      <div>
        <label className="block text-xs text-slate-300 mb-2">
          Roughness: <span className="text-cyan-300">{materialProps.roughness.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={materialProps.roughness}
          onChange={(e) => updateMaterial({ roughness: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Emissive */}
      <div>
        <label className="block text-xs text-slate-300 mb-2">Emissive Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={materialProps.emissive}
            onChange={(e) => updateMaterial({ emissive: e.target.value })}
            className="w-16 h-10 rounded border border-slate-700 bg-slate-800 cursor-pointer"
          />
          <input
            type="text"
            value={materialProps.emissive}
            onChange={(e) => updateMaterial({ emissive: e.target.value })}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-100"
          />
        </div>
      </div>

      {/* Emissive Intensity */}
      <div>
        <label className="block text-xs text-slate-300 mb-2">
          Emissive Intensity: <span className="text-cyan-300">{materialProps.emissiveIntensity.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={materialProps.emissiveIntensity}
          onChange={(e) => updateMaterial({ emissiveIntensity: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Transparency */}
      <div>
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={materialProps.transparent}
            onChange={(e) => updateMaterial({ transparent: e.target.checked })}
            className="w-4 h-4"
          />
          Enable Transparency
        </label>
      </div>

      {/* Opacity (if transparent) */}
      {materialProps.transparent && (
        <div>
          <label className="block text-xs text-slate-300 mb-2">
            Opacity: <span className="text-cyan-300">{materialProps.opacity.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={materialProps.opacity}
            onChange={(e) => updateMaterial({ opacity: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      )}

      {/* Info */}
      <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
        <p>PBR (Physically Based Rendering) materials provide realistic lighting.</p>
      </div>
    </div>
  );
};

export default MaterialEditor;
