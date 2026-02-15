import * as THREE from "three";

// ------------------ curved branch tube ------------------
export function makeBranchTube(start, end, thickness, swirlStrength = 0.9) {
  const dir = end.clone().sub(start);
  const len = dir.length();

  const c1 = start.clone().lerp(end, 0.33);
  const c2 = start.clone().lerp(end, 0.66);

  const swirl = swirlStrength * (0.6 + Math.random() * 0.7);
  const a1 = swirl;
  const a2 = -swirl * 0.8;

  const radial1 = new THREE.Vector3(c1.x, 0, c1.z)
    .normalize()
    .multiplyScalar(len * 0.10);
  const radial2 = new THREE.Vector3(c2.x, 0, c2.z)
    .normalize()
    .multiplyScalar(len * 0.08);

  radial1.applyAxisAngle(new THREE.Vector3(0, 1, 0), a1);
  radial2.applyAxisAngle(new THREE.Vector3(0, 1, 0), a2);

  c1.add(radial1);
  c2.add(radial2);

  const droop = (Math.random() < 0.35 ? 1 : 0) * (len * 0.05);
  c1.y -= droop;
  c2.y -= droop * 0.7;

  const curve = new THREE.CatmullRomCurve3([start, c1, c2, end]);
  return new THREE.TubeGeometry(curve, 28, thickness, 10, false);
}

// ------------------ sparks ------------------
export function makeSparks(count = 140) {
  const geom = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const ix = i * 3;
    positions[ix + 0] = (Math.random() - 0.5) * 0.9;
    positions[ix + 1] = Math.random() * 0.4;
    positions[ix + 2] = (Math.random() - 0.5) * 0.9;

    velocities[ix + 0] = (Math.random() - 0.5) * 0.08;
    velocities[ix + 1] = 0.25 + Math.random() * 0.45;
    velocities[ix + 2] = (Math.random() - 0.5) * 0.08;
  }

  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.userData.velocities = velocities;

  const mat = new THREE.PointsMaterial({
    color: 0xffb300,
    size: 0.08,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });

  return new THREE.Points(geom, mat);
}

// ------------------ ORB ASSET ------------------
function makeRadialGlowTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");

  const g = ctx.createRadialGradient(128, 128, 18, 128, 128, 128);
  g.addColorStop(0.0, "rgba(255,255,255,0.85)");
  g.addColorStop(0.22, "rgba(255,255,255,0.35)");
  g.addColorStop(0.55, "rgba(255,255,255,0.12)");
  g.addColorStop(1.0, "rgba(255,255,255,0.0)");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/**
 * Returns:
 *  - group: group you add to the scene
 *  - hitMesh: the sphere mesh to raycast
 *  - logoSprite: billboard sprite
 */
export function makeOrbAsset({ radius, pal, logoTex }) {
  const group = new THREE.Group();

  const sphereGeom = new THREE.SphereGeometry(radius, 28, 20);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: pal.base,
    emissive: pal.emissive,
    emissiveIntensity: Math.max(0.55, pal.ei),
    roughness: 0.22,
    metalness: 0.18,
    transparent: true,
    opacity: 0.98
  });

  const sphere = new THREE.Mesh(sphereGeom, sphereMat);
  group.add(sphere);

  const glowTex = makeRadialGlowTexture();
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex,
    color: new THREE.Color(pal.emissive),
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(radius * 3.0, radius * 3.0, 1);
  group.add(glow);

  const logoMat = new THREE.SpriteMaterial({
    map: logoTex,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    opacity: 0.98
  });
  const logo = new THREE.Sprite(logoMat);
  logo.scale.set(radius * 1.65, radius * 1.65, 1);
  group.add(logo);

  return { group, hitMesh: sphere, logoSprite: logo };
}
