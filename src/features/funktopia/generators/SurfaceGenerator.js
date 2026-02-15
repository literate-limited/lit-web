/**
 * Surface Generator
 * Generates parametric surfaces from mathematical functions z = f(x, y)
 */

import * as THREE from 'three';
import { BaseGenerator } from './BaseGenerator';

export class SurfaceGenerator extends BaseGenerator {
  constructor() {
    super('Surface', 'Parametric mathematical surfaces z = f(x, y)');

    this.parameters = {
      equation: 'ripple',
      xMin: -5,
      xMax: 5,
      yMin: -5,
      yMax: 5,
      resolution: 50,
      amplitude: 2,
      frequency: 1,
    };
  }

  getParameterConfig() {
    return [
      {
        key: 'equation',
        label: 'Equation',
        type: 'select',
        options: [
          { value: 'ripple', label: 'Ripple' },
          { value: 'wave', label: 'Wave' },
          { value: 'saddle', label: 'Saddle' },
          { value: 'peaks', label: 'Peaks' },
          { value: 'gaussian', label: 'Gaussian' },
          { value: 'torus', label: 'Torus Knot' },
        ]
      },
      { key: 'xMin', label: 'X Min', type: 'slider', min: -10, max: 0, step: 0.5 },
      { key: 'xMax', label: 'X Max', type: 'slider', min: 0, max: 10, step: 0.5 },
      { key: 'yMin', label: 'Y Min', type: 'slider', min: -10, max: 0, step: 0.5 },
      { key: 'yMax', label: 'Y Max', type: 'slider', min: 0, max: 10, step: 0.5 },
      { key: 'resolution', label: 'Resolution', type: 'slider', min: 20, max: 100, step: 5 },
      { key: 'amplitude', label: 'Amplitude', type: 'slider', min: 0.5, max: 5, step: 0.1 },
      { key: 'frequency', label: 'Frequency', type: 'slider', min: 0.5, max: 3, step: 0.1 },
    ];
  }

  getPresets() {
    return [
      {
        id: 'ripple',
        name: 'Ripple Surface',
        params: { equation: 'ripple', xMin: -5, xMax: 5, yMin: -5, yMax: 5, resolution: 50, amplitude: 2, frequency: 1 },
        note: 'Classic ripple effect from center',
      },
      {
        id: 'wave',
        name: 'Wave Surface',
        params: { equation: 'wave', xMin: -5, xMax: 5, yMin: -5, yMax: 5, resolution: 50, amplitude: 1.5, frequency: 1.5 },
        note: 'Sine wave across x-y plane',
      },
      {
        id: 'saddle',
        name: 'Hyperbolic Saddle',
        params: { equation: 'saddle', xMin: -3, xMax: 3, yMin: -3, yMax: 3, resolution: 60, amplitude: 1, frequency: 1 },
        note: 'Classic saddle point surface',
      },
    ];
  }

  /**
   * Evaluate surface equation at point (x, y)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Z value
   */
  evaluateEquation(x, y) {
    const { equation, amplitude, frequency } = this.parameters;

    switch (equation) {
      case 'ripple': {
        // z = sin(√(x² + y²)) / √(x² + y²)
        const r = Math.sqrt(x * x + y * y);
        if (r === 0) return amplitude;
        return amplitude * Math.sin(r * frequency) / (r * 0.3);
      }

      case 'wave': {
        // z = sin(x) * cos(y)
        return amplitude * Math.sin(x * frequency) * Math.cos(y * frequency);
      }

      case 'saddle': {
        // z = x² - y²
        return amplitude * (x * x - y * y) * 0.2;
      }

      case 'peaks': {
        // z = 3(1-x)²e^(-x²-(y+1)²) - similar to MATLAB peaks
        const exp1 = Math.exp(-(x * x) - (y + 1) * (y + 1));
        const exp2 = Math.exp(-(x * x) - (y * y));
        return amplitude * (3 * (1 - x) * (1 - x) * exp1 - 2 * exp2);
      }

      case 'gaussian': {
        // z = e^(-(x²+y²))
        const r2 = x * x + y * y;
        return amplitude * Math.exp(-r2 / (frequency * 2));
      }

      case 'torus': {
        // Torus knot-inspired height field
        const angle = Math.atan2(y, x);
        const r = Math.sqrt(x * x + y * y);
        return amplitude * Math.sin(r * frequency + angle * 3);
      }

      default:
        return 0;
    }
  }

  generate() {
    const { xMin, xMax, yMin, yMax, resolution } = this.parameters;

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];

    // Generate vertices
    for (let i = 0; i <= resolution; i++) {
      const v = i / resolution;
      const y = yMin + v * (yMax - yMin);

      for (let j = 0; j <= resolution; j++) {
        const u = j / resolution;
        const x = xMin + u * (xMax - xMin);
        const z = this.evaluateEquation(x, y);

        positions.push(x, z, y);
        uvs.push(u, v);
      }
    }

    // Generate indices for triangles
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const a = i * (resolution + 1) + j;
        const b = a + 1;
        const c = a + resolution + 1;
        const d = c + 1;

        // Two triangles per quad
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  generateFilename() {
    const { equation } = this.parameters;
    const timestamp = new Date().toISOString().split('T')[0];
    return `surface-${equation}-${timestamp}`;
  }
}
