/**
 * Paint Interaction
 * Handles mouse/touch interaction for painting on 3D meshes
 */

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { paintStroke, interpolatePaintStroke, eraseStroke, sampleColor, updateTexture } from '../utils/paintCanvas';

const PaintInteraction = ({ asset, selectedMesh, activeTool, brush, onColorSample, canvasRef, textureRef }) => {
  const { camera, gl, raycaster: threeRaycaster } = useThree();
  const raycaster = useRef(threeRaycaster || new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const isPainting = useRef(false);
  const lastUV = useRef(null);

  useEffect(() => {
    if (activeTool !== 'paint' || !selectedMesh || !canvasRef.current) {
      return;
    }

    const canvas = gl.domElement;
    const ctx = canvasRef.current.getContext('2d');

    const handleMouseDown = (event) => {
      if (event.button !== 0) return; // Only left click
      isPainting.current = true;
      handlePaint(event);
    };

    const handleMouseMove = (event) => {
      if (!isPainting.current) return;
      handlePaint(event);
    };

    const handleMouseUp = () => {
      isPainting.current = false;
      lastUV.current = null;
    };

    const handlePaint = (event) => {
      // Calculate mouse position
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycast
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObject(selectedMesh, true);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        const uv = intersect.uv;

        if (uv) {
          const currentUV = { u: uv.x, v: uv.y };

          if (brush.mode === 'paint') {
            if (lastUV.current) {
              // Interpolate between last and current UV for smooth strokes
              interpolatePaintStroke(ctx, lastUV.current, currentUV, brush);
            } else {
              // First stroke
              paintStroke(ctx, currentUV.u, currentUV.v, brush);
            }
          } else if (brush.mode === 'erase') {
            eraseStroke(ctx, currentUV.u, currentUV.v, brush.size);
          } else if (brush.mode === 'eyedropper') {
            const color = sampleColor(ctx, currentUV.u, currentUV.v);
            if (onColorSample) {
              onColorSample(color);
            }
            isPainting.current = false; // One-shot for eyedropper
          }

          // Update texture
          if (textureRef.current) {
            updateTexture(textureRef.current);
          }

          lastUV.current = currentUV;
        }
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [asset, selectedMesh, activeTool, brush, camera, gl, onColorSample, canvasRef, textureRef]);

  return null; // No visual component
};

export default PaintInteraction;
