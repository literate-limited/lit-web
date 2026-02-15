import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

const clampResolution = (value) => Math.min(256, Math.max(8, Math.floor(value)));

const buildSurfaceGeometry = (fn, size, resolution, heightScale) => {
  const segments = clampResolution(resolution);
  const vertexCount = (segments + 1) * (segments + 1);
  const positions = new Float32Array(vertexCount * 3);
  const indices = [];
  const half = size / 2;
  const step = size / segments;
  let ptr = 0;

  for (let iy = 0; iy <= segments; iy += 1) {
    const y = -half + iy * step;
    for (let ix = 0; ix <= segments; ix += 1) {
      const x = -half + ix * step;
      let z = 0;
      try {
        z = fn(x, y);
      } catch {
        z = 0;
      }
      if (!Number.isFinite(z)) z = 0;
      positions[ptr++] = x;
      positions[ptr++] = z * heightScale;
      positions[ptr++] = y;
    }
  }

  for (let iy = 0; iy < segments; iy += 1) {
    for (let ix = 0; ix < segments; ix += 1) {
      const a = iy * (segments + 1) + ix;
      const b = a + 1;
      const c = a + (segments + 1);
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();

  return geometry;
};

const SurfaceMesh = ({ fn, color, size, resolution, heightScale, wireframe }) => {
  const geometry = useMemo(
    () => buildSurfaceGeometry(fn, size, resolution, heightScale),
    [fn, size, resolution, heightScale]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        metalness={0.08}
        roughness={0.35}
        wireframe={wireframe}
      />
    </mesh>
  );
};

const SurfaceCanvas = forwardRef(
  ({ surfaces, size, resolution, heightScale, wireframe }, ref) => {
    const groupRef = useRef();
    const controlsRef = useRef();

    useImperativeHandle(ref, () => ({
      async exportGlb() {
        if (!groupRef.current) {
          throw new Error("Surface not ready");
        }
        const exporter = new GLTFExporter();
        return new Promise((resolve, reject) => {
          exporter.parse(
            groupRef.current,
            (gltf) => {
              try {
                let blob;
                if (gltf instanceof ArrayBuffer) {
                  blob = new Blob([gltf], { type: "model/gltf-binary" });
                } else {
                  blob = new Blob([JSON.stringify(gltf)], { type: "model/gltf+json" });
                }
                resolve(blob);
              } catch (err) {
                reject(err);
              }
            },
            (err) => reject(err),
            { binary: true }
          );
        });
      },
      resetCamera() {
        controlsRef.current?.reset();
      },
    }));

    const visibleSurfaces = surfaces.filter((surface) => surface.visible && surface.evaluator);

    return (
      <Canvas
        shadows
        camera={{ position: [9, 8, 9], fov: 45, near: 0.1, far: 100 }}
      >
        <color attach="background" args={["#050913"]} />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[7, 10, 6]}
          intensity={1.15}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <group ref={groupRef} position={[0, 0, 0]}>
          {visibleSurfaces.map((surface) => (
            <SurfaceMesh
              key={surface.id}
              fn={(x, y) => surface.evaluator({ x, y })}
              color={surface.color}
              size={size}
              resolution={resolution}
              heightScale={heightScale}
              wireframe={wireframe}
            />
          ))}
        </group>

        <gridHelper
          args={[size * 1.5, Math.min(48, clampResolution(resolution)), "#0f172a", "#0ea5e9"]}
          position={[0, -0.001, 0]}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
          <planeGeometry args={[size * 1.5, size * 1.5, 1, 1]} />
          <meshStandardMaterial color="#0a1022" transparent opacity={0.8} />
        </mesh>

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.1}
          target={[0, 0, 0]}
          maxDistance={40}
          minDistance={3}
        />
      </Canvas>
    );
  }
);

SurfaceCanvas.displayName = "SurfaceCanvas";

export default SurfaceCanvas;
