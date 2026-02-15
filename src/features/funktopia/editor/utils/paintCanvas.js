/**
 * Paint Canvas Utilities
 * Handles texture painting operations on HTML5 canvas
 */

import * as THREE from 'three';

/**
 * Create a paint canvas for a texture
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {string} initialColor - Initial fill color
 * @returns {Object} Canvas and context
 */
export function createPaintCanvas(width = 2048, height = 2048, initialColor = '#808080') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  // Fill with initial color
  ctx.fillStyle = initialColor;
  ctx.fillRect(0, 0, width, height);

  return { canvas, ctx };
}

/**
 * Paint a stroke on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X coordinate (0-1)
 * @param {number} y - Y coordinate (0-1)
 * @param {Object} brush - Brush properties
 */
export function paintStroke(ctx, x, y, brush) {
  const canvasX = x * ctx.canvas.width;
  const canvasY = (1 - y) * ctx.canvas.height; // Flip Y for texture coordinates

  const radius = brush.size * Math.min(ctx.canvas.width, ctx.canvas.height) / 200;

  // Set brush properties
  ctx.globalAlpha = brush.opacity;
  ctx.fillStyle = brush.color;

  if (brush.hardness < 1) {
    // Soft brush with gradient
    const gradient = ctx.createRadialGradient(canvasX, canvasY, 0, canvasX, canvasY, radius);
    gradient.addColorStop(0, brush.color);
    gradient.addColorStop(brush.hardness, brush.color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
  }

  // Draw circle
  ctx.beginPath();
  ctx.arc(canvasX, canvasY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Reset alpha
  ctx.globalAlpha = 1;
}

/**
 * Interpolate paint strokes for smooth lines
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} prevUV - Previous UV coordinates {u, v}
 * @param {Object} currentUV - Current UV coordinates {u, v}
 * @param {Object} brush - Brush properties
 */
export function interpolatePaintStroke(ctx, prevUV, currentUV, brush) {
  const distance = Math.sqrt(
    Math.pow(currentUV.u - prevUV.u, 2) +
    Math.pow(currentUV.v - prevUV.v, 2)
  );

  // Number of interpolation steps based on distance
  const steps = Math.max(1, Math.floor(distance * 1000));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = prevUV.u + (currentUV.u - prevUV.u) * t;
    const v = prevUV.v + (currentUV.v - prevUV.v) * t;
    paintStroke(ctx, u, v, brush);
  }
}

/**
 * Erase on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X coordinate (0-1)
 * @param {number} y - Y coordinate (0-1)
 * @param {number} size - Eraser size
 */
export function eraseStroke(ctx, x, y, size) {
  const canvasX = x * ctx.canvas.width;
  const canvasY = (1 - y) * ctx.canvas.height;
  const radius = size * Math.min(ctx.canvas.width, ctx.canvas.height) / 200;

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(canvasX, canvasY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * Fill entire canvas with color
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} color - Fill color
 */
export function fillCanvas(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Clear canvas to transparent
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
export function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Create Three.js texture from canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {THREE.CanvasTexture}
 */
export function createTextureFromCanvas(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Update Three.js texture from canvas
 * @param {THREE.CanvasTexture} texture - Three.js texture
 */
export function updateTexture(texture) {
  texture.needsUpdate = true;
}

/**
 * Sample color from canvas at UV coordinates
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} u - U coordinate (0-1)
 * @param {number} v - V coordinate (0-1)
 * @returns {string} Hex color
 */
export function sampleColor(ctx, u, v) {
  const x = Math.floor(u * ctx.canvas.width);
  const y = Math.floor((1 - v) * ctx.canvas.height);

  const pixel = ctx.getImageData(x, y, 1, 1).data;
  const r = pixel[0];
  const g = pixel[1];
  const b = pixel[2];

  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}
