/**
 * Funktopia Asset Exporters
 * Utilities for exporting Three.js scenes/meshes to various 3D file formats
 */

import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

/**
 * Export a Three.js object to glTF/GLB format
 * @param {THREE.Object3D} object - The object to export (Scene, Mesh, Group)
 * @param {Object} options - Export options
 * @param {boolean} options.binary - Export as GLB (true) or glTF (false)
 * @param {string} options.filename - Filename for download
 * @returns {Promise<void>}
 */
export async function exportGLTF(object, options = {}) {
  const {
    binary = true,
    filename = 'funktopia-asset',
  } = options;

  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();

    const exportOptions = {
      binary,
      embedImages: true,
      maxTextureSize: 4096,
    };

    exporter.parse(
      object,
      (result) => {
        if (binary) {
          // GLB binary format
          downloadBlob(result, `${filename}.glb`, 'application/octet-stream');
        } else {
          // glTF JSON format
          const json = JSON.stringify(result, null, 2);
          downloadString(json, `${filename}.gltf`, 'application/json');
        }
        resolve();
      },
      (error) => {
        console.error('Export error:', error);
        reject(error);
      },
      exportOptions
    );
  });
}

/**
 * Export a Three.js object to OBJ format
 * @param {THREE.Object3D} object - The object to export
 * @param {Object} options - Export options
 * @param {string} options.filename - Filename for download
 * @returns {void}
 */
export function exportOBJ(object, options = {}) {
  const { filename = 'funktopia-asset' } = options;

  const objContent = generateOBJ(object);
  downloadString(objContent, `${filename}.obj`, 'text/plain');
}

/**
 * Generate OBJ file content from Three.js object
 * @param {THREE.Object3D} object - The object to convert
 * @returns {string} OBJ file content
 */
function generateOBJ(object) {
  let output = '# Funktopia Export\n';
  output += '# https://lit.education\n\n';

  let vertexIndex = 1;
  const vertexMap = new Map();

  object.traverse((child) => {
    if (child.isMesh && child.geometry) {
      const geometry = child.geometry;
      const positionAttribute = geometry.attributes.position;
      const normalAttribute = geometry.attributes.normal;

      if (!positionAttribute) return;

      output += `o ${child.name || 'mesh'}\n`;

      // Export vertices
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        output += `v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
      }

      // Export normals
      if (normalAttribute) {
        for (let i = 0; i < normalAttribute.count; i++) {
          const nx = normalAttribute.getX(i);
          const ny = normalAttribute.getY(i);
          const nz = normalAttribute.getZ(i);
          output += `vn ${nx.toFixed(6)} ${ny.toFixed(6)} ${nz.toFixed(6)}\n`;
        }
      }

      // Export faces
      const index = geometry.index;
      if (index) {
        // Indexed geometry
        for (let i = 0; i < index.count; i += 3) {
          const a = index.getX(i) + vertexIndex;
          const b = index.getX(i + 1) + vertexIndex;
          const c = index.getX(i + 2) + vertexIndex;

          if (normalAttribute) {
            output += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
          } else {
            output += `f ${a} ${b} ${c}\n`;
          }
        }
      } else {
        // Non-indexed geometry
        for (let i = 0; i < positionAttribute.count; i += 3) {
          const a = i + vertexIndex;
          const b = i + 1 + vertexIndex;
          const c = i + 2 + vertexIndex;

          if (normalAttribute) {
            output += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
          } else {
            output += `f ${a} ${b} ${c}\n`;
          }
        }
      }

      vertexIndex += positionAttribute.count;
      output += '\n';
    }
  });

  return output;
}

/**
 * Download a Blob as a file
 * @param {Blob|ArrayBuffer} data - The data to download
 * @param {string} filename - The filename
 * @param {string} mimeType - MIME type
 */
function downloadBlob(data, filename, mimeType) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  downloadURL(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Download a string as a file
 * @param {string} text - The text content
 * @param {string} filename - The filename
 * @param {string} mimeType - MIME type
 */
function downloadString(text, filename, mimeType) {
  downloadBlob(text, filename, mimeType);
}

/**
 * Trigger download of a URL
 * @param {string} url - The URL to download
 * @param {string} filename - The filename
 */
function downloadURL(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate a filename based on current parameters
 * @param {Object} params - Coaster parameters
 * @returns {string} Generated filename
 */
export function generateFilename(params) {
  const timestamp = new Date().toISOString().split('T')[0];
  return `coaster-${params.drop}d-${params.loops}l-${params.twists}t-${timestamp}`;
}
