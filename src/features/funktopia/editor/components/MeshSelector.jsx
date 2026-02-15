/**
 * Mesh Selector
 * Click on meshes in the viewport to select them
 */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

const MeshSelector = ({ asset, activeTool, onMeshSelect }) => {
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    if (activeTool !== 'select' && activeTool !== 'material') {
      return;
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event) => {
      // Calculate mouse position in normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycast
      raycaster.setFromCamera(mouse, camera);

      if (asset && asset.scene) {
        const intersects = raycaster.intersectObjects(asset.scene.children, true);

        if (intersects.length > 0) {
          // Find the first mesh
          for (const intersect of intersects) {
            if (intersect.object.isMesh) {
              onMeshSelect(intersect.object);
              break;
            }
          }
        }
      }
    };

    gl.domElement.addEventListener('click', handleClick);

    return () => {
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [asset, activeTool, camera, gl, scene, onMeshSelect]);

  return null; // No visual component
};

export default MeshSelector;
