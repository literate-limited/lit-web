/**
 * Coaster Generator
 * Generates rollercoaster tracks using parametric curves
 */

import * as THREE from 'three';
import { BaseGenerator } from './BaseGenerator';

export class CoasterGenerator extends BaseGenerator {
  constructor() {
    super('Coaster', 'Parametric rollercoaster tracks with loops and twists');

    // Set default parameters
    this.parameters = {
      drop: 110,
      hill: 60,
      loops: 1,
      twists: 3,
      length: 260,
    };
  }

  getParameterConfig() {
    return [
      { key: 'drop', label: 'Drop Height', type: 'slider', min: 30, max: 140, step: 1 },
      { key: 'hill', label: 'Hill Size', type: 'slider', min: 10, max: 90, step: 1 },
      { key: 'loops', label: 'Number of Loops', type: 'slider', min: 0, max: 4, step: 1 },
      { key: 'twists', label: 'Twists', type: 'slider', min: 0, max: 8, step: 1 },
      { key: 'length', label: 'Track Length', type: 'slider', min: 120, max: 360, step: 5 },
    ];
  }

  getPresets() {
    return [
      {
        id: 'kingda',
        name: 'Kingda Ka (Inspired)',
        params: { drop: 110, hill: 60, loops: 1, twists: 3, length: 260 },
        note: 'Tall top hat, sharp drop, a few rolls.',
      },
      {
        id: 'steelDragon',
        name: 'Steel Dragon (Inspired)',
        params: { drop: 95, hill: 50, loops: 0, twists: 1, length: 300 },
        note: 'Long airtime hills, low inversion count.',
      },
      {
        id: 'formulaRossa',
        name: 'Formula Rossa (Inspired)',
        params: { drop: 70, hill: 40, loops: 0, twists: 4, length: 220 },
        note: 'Fast launch with multiple twists.',
      },
    ];
  }

  buildTrackPoints() {
    const { drop, hill, loops, twists, length } = this.parameters;
    const pts = [];
    const segments = 240;

    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      const x = (t - 0.5) * length * 0.04;
      const yDrop = -drop * Math.sin(Math.min(t, 0.5) * Math.PI);
      const yHills = hill * Math.sin(t * Math.PI * 2);
      const y = yDrop + yHills;
      const zLoops = loops > 0 ? Math.sin(t * Math.PI * loops) * (drop * 0.2) : 0;
      const zTwist = Math.sin(t * Math.PI * twists) * (length * 0.02);
      const z = zLoops + zTwist;
      pts.push(new THREE.Vector3(x, y * 0.1, z * 0.1));
    }

    return new THREE.CatmullRomCurve3(pts);
  }

  generate() {
    const curve = this.buildTrackPoints();
    return new THREE.TubeGeometry(curve, 320, 0.25, 12, false);
  }

  generateFilename() {
    const { drop, loops, twists } = this.parameters;
    const timestamp = new Date().toISOString().split('T')[0];
    return `coaster-${drop}d-${loops}l-${twists}t-${timestamp}`;
  }
}
