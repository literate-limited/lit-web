/**
 * Primitive Deformation Generator
 * Generates deformed primitive shapes using noise functions
 */

import * as THREE from 'three';
import { BaseGenerator } from './BaseGenerator';
import { fractalNoise } from '../utils/noise';

export class PrimitiveGenerator extends BaseGenerator {
  constructor() {
    super('Primitive', 'Deformed primitive shapes using noise functions');

    this.parameters = {
      primitive: 'sphere',
      resolution: 40,
      deformStrength: 0.3,
      noiseScale: 2,
      noiseOctaves: 4,
      seed: 12345,
    };
  }

  getParameterConfig() {
    return [
      {
        key: 'primitive',
        label: 'Base Shape',
        type: 'select',
        options: [
          { value: 'sphere', label: 'Sphere' },
          { value: 'cube', label: 'Cube' },
          { value: 'cylinder', label: 'Cylinder' },
          { value: 'torus', label: 'Torus' },
        ],
      },
      { key: 'resolution', label: 'Resolution', type: 'slider', min: 20, max: 80, step: 5 },
      { key: 'deformStrength', label: 'Deform Strength', type: 'slider', min: 0, max: 1, step: 0.05 },
      { key: 'noiseScale', label: 'Noise Scale', type: 'slider', min: 0.5, max: 5, step: 0.1 },
      { key: 'noiseOctaves', label: 'Noise Detail', type: 'slider', min: 1, max: 6, step: 1 },
      { key: 'seed', label: 'Random Seed', type: 'slider', min: 1, max: 99999, step: 1 },
    ];
  }

  getPresets() {
    return [
      {
        id: 'organic-sphere',
        name: 'Organic Sphere',
        params: { primitive: 'sphere', resolution: 50, deformStrength: 0.4, noiseScale: 2, noiseOctaves: 4, seed: 12345 },
        note: 'Smooth organic deformation',
      },
      {
        id: 'rocky-asteroid',
        name: 'Rocky Asteroid',
        params: { primitive: 'sphere', resolution: 60, deformStrength: 0.7, noiseScale: 3, noiseOctaves: 5, seed: 54321 },
        note: 'High detail rocky surface',
      },
      {
        id: 'warped-cube',
        name: 'Warped Cube',
        params: { primitive: 'cube', resolution: 40, deformStrength: 0.3, noiseScale: 1.5, noiseOctaves: 3, seed: 99999 },
        note: 'Subtly deformed cube',
      },
      {
        id: 'twisted-torus',
        name: 'Twisted Torus',
        params: { primitive: 'torus', resolution: 50, deformStrength: 0.25, noiseScale: 2.5, noiseOctaves: 4, seed: 42000 },
        note: 'Torus with noise ripples',
      },
    ];
  }

  createBasePrimitive() {
    const { primitive, resolution } = this.parameters;

    switch (primitive) {
      case 'sphere':
        return new THREE.SphereGeometry(5, resolution, resolution);

      case 'cube':
        return new THREE.BoxGeometry(8, 8, 8, resolution / 4, resolution / 4, resolution / 4);

      case 'cylinder':
        return new THREE.CylinderGeometry(4, 4, 10, resolution, resolution / 2);

      case 'torus':
        return new THREE.TorusGeometry(5, 2, resolution / 2, resolution);

      default:
        return new THREE.SphereGeometry(5, resolution, resolution);
    }
  }

  applyNoiseDeformation(geometry) {
    const { deformStrength, noiseScale, noiseOctaves, seed } = this.parameters;

    const position = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i);

      // Get noise value at vertex position
      const noise = fractalNoise(
        vertex.x * noiseScale,
        vertex.y * noiseScale,
        vertex.z * noiseScale,
        noiseOctaves,
        0.5,
        2,
        seed
      );

      // Displace along vertex normal direction
      const normal = vertex.clone().normalize();
      const displacement = noise * deformStrength * 2; // Scale for visibility

      vertex.add(normal.multiplyScalar(displacement));

      position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  generate() {
    const geometry = this.createBasePrimitive();
    this.applyNoiseDeformation(geometry);
    return geometry;
  }

  generateFilename() {
    const { primitive, seed } = this.parameters;
    const timestamp = new Date().toISOString().split('T')[0];
    return `primitive-${primitive}-${seed}-${timestamp}`;
  }
}
