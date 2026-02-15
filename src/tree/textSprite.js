import * as THREE from "three";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function makeTextSprite(text, { fontSize = 42, padding = 16 } = {}) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  ctx.font = `700 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  const metrics = ctx.measureText(text);
  const textW = Math.ceil(metrics.width);
  const textH = Math.ceil(fontSize * 1.2);

  canvas.width = textW + padding * 2;
  canvas.height = textH + padding * 2;

  ctx.font = `700 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  roundRect(ctx, 0, 0, canvas.width, canvas.height, 18);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  const material = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(material);

  const scale = 0.015;
  sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);

  return sprite;
}
