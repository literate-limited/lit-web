/**
 * Viewport Scene
 * Renders the imported 3D asset in the editor
 */

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import MeshSelector from './MeshSelector';
import PaintInteraction from './PaintInteraction';

const ViewportScene = ({ asset, selectedObject, activeTool, onMeshSelect, paintBrush, onColorSample, paintCanvasRef, paintTextureRef }) => {
  const groupRef = useRef();
  const [sceneObject, setSceneObject] = useState(null);

  useEffect(() => {
    if (asset && asset.scene) {
      // Clone the scene to avoid modifying the original
      const clone = asset.scene.clone();
      setSceneObject(clone);
    } else {
      setSceneObject(null);
    }
  }, [asset]);

  // Optional: Rotate for visual interest (can be removed later)
  useFrame((state, delta) => {
    if (groupRef.current && sceneObject) {
      // Gentle rotation when no interaction
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  if (!sceneObject) return null;

  return (
    <>
      <group ref={groupRef}>
        <primitive object={sceneObject} />
      </group>

      <MeshSelector
        asset={asset}
        activeTool={activeTool}
        onMeshSelect={onMeshSelect}
      />

      {activeTool === 'paint' && (
        <PaintInteraction
          asset={asset}
          selectedMesh={selectedObject}
          activeTool={activeTool}
          brush={paintBrush}
          onColorSample={onColorSample}
          canvasRef={paintCanvasRef}
          textureRef={paintTextureRef}
        />
      )}
    </>
  );
};

export default ViewportScene;
