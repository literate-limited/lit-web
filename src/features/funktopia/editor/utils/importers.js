/**
 * Asset Importers
 * Utilities for loading 3D files (glTF, OBJ, FBX) into the editor
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

/**
 * Import a glTF/GLB file
 * @param {File|string} source - File object or URL
 * @returns {Promise<Object>} Imported asset data
 */
export async function importGLTF(source) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    const onLoad = (gltf) => {
      const asset = {
        type: 'gltf',
        source: source instanceof File ? source.name : source,
        scene: gltf.scene,
        animations: gltf.animations,
        cameras: gltf.cameras,
        userData: gltf.userData,
        meshes: [],
        materials: [],
        textures: [],
      };

      // Extract meshes and materials
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          asset.meshes.push(child);

          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              if (!asset.materials.includes(mat)) {
                asset.materials.push(mat);

                // Extract textures
                Object.keys(mat).forEach((key) => {
                  if (mat[key] && mat[key].isTexture) {
                    if (!asset.textures.includes(mat[key])) {
                      asset.textures.push(mat[key]);
                    }
                  }
                });
              }
            });
          }
        }
      });

      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(gltf.scene);
      asset.boundingBox = box;
      asset.center = box.getCenter(new THREE.Vector3());
      asset.size = box.getSize(new THREE.Vector3());

      resolve(asset);
    };

    const onError = (error) => {
      console.error('GLTF import error:', error);
      reject(new Error(`Failed to load glTF: ${error.message}`));
    };

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const blob = new Blob([arrayBuffer]);
        const url = URL.createObjectURL(blob);
        loader.load(url, onLoad, undefined, onError);
        // Clean up URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(source);
    } else {
      // URL
      loader.load(source, onLoad, undefined, onError);
    }
  });
}

/**
 * Import an OBJ file
 * @param {File|string} source - File object or URL
 * @returns {Promise<Object>} Imported asset data
 */
export async function importOBJ(source) {
  return new Promise((resolve, reject) => {
    const loader = new OBJLoader();

    const onLoad = (obj) => {
      const asset = {
        type: 'obj',
        source: source instanceof File ? source.name : source,
        scene: obj,
        meshes: [],
        materials: [],
        textures: [],
      };

      // Extract meshes and materials
      obj.traverse((child) => {
        if (child.isMesh) {
          asset.meshes.push(child);

          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
              if (!asset.materials.includes(mat)) {
                asset.materials.push(mat);
              }
            });
          }

          // Compute vertex normals if missing
          if (child.geometry && !child.geometry.attributes.normal) {
            child.geometry.computeVertexNormals();
          }
        }
      });

      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(obj);
      asset.boundingBox = box;
      asset.center = box.getCenter(new THREE.Vector3());
      asset.size = box.getSize(new THREE.Vector3());

      resolve(asset);
    };

    const onError = (error) => {
      console.error('OBJ import error:', error);
      reject(new Error(`Failed to load OBJ: ${error.message}`));
    };

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const obj = loader.parse(text);
        onLoad(obj);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(source);
    } else {
      // URL
      loader.load(source, onLoad, undefined, onError);
    }
  });
}

/**
 * Auto-detect format and import file
 * @param {File} file - File object
 * @returns {Promise<Object>} Imported asset data
 */
export async function importAsset(file) {
  const extension = file.name.split('.').pop().toLowerCase();

  switch (extension) {
    case 'glb':
    case 'gltf':
      return importGLTF(file);

    case 'obj':
      return importOBJ(file);

    default:
      throw new Error(`Unsupported file format: .${extension}`);
  }
}

/**
 * Center and scale asset to fit in view
 * @param {Object} asset - Asset data
 * @param {number} targetSize - Target maximum dimension
 */
export function normalizeAsset(asset, targetSize = 10) {
  if (!asset.scene) return;

  // Center the asset
  asset.scene.position.sub(asset.center);

  // Scale to fit
  const maxDimension = Math.max(asset.size.x, asset.size.y, asset.size.z);
  if (maxDimension > 0) {
    const scale = targetSize / maxDimension;
    asset.scene.scale.multiplyScalar(scale);
  }

  // Update bounding box after transformation
  const box = new THREE.Box3().setFromObject(asset.scene);
  asset.boundingBox = box;
  asset.center = box.getCenter(new THREE.Vector3());
  asset.size = box.getSize(new THREE.Vector3());
}

/**
 * Get asset statistics
 * @param {Object} asset - Asset data
 * @returns {Object} Statistics
 */
export function getAssetStats(asset) {
  let totalVertices = 0;
  let totalTriangles = 0;

  asset.meshes.forEach((mesh) => {
    if (mesh.geometry) {
      const positions = mesh.geometry.attributes.position;
      if (positions) {
        totalVertices += positions.count;
      }

      if (mesh.geometry.index) {
        totalTriangles += mesh.geometry.index.count / 3;
      } else if (positions) {
        totalTriangles += positions.count / 3;
      }
    }
  });

  return {
    meshCount: asset.meshes.length,
    materialCount: asset.materials.length,
    textureCount: asset.textures.length,
    vertexCount: totalVertices,
    triangleCount: Math.floor(totalTriangles),
    size: asset.size,
    hasAnimations: asset.animations?.length > 0,
  };
}
