import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const SoldierInstances = ({
  rows = 7,
  cols = 9,
  spacing = 1.3,
  jitter = 0.2,
  color = "#b8734e",
  highlightColor = "#d49762",
}) => {
  const meshRef = useRef();
  const groupRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const commanderColor = useMemo(() => new THREE.Color(highlightColor), [highlightColor]);
  const geometry = useMemo(
    () => new THREE.CapsuleGeometry(0.22, 0.7, 8, 14),
    []
  );
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0.05,
        vertexColors: true,
      }),
    [color]
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    let i = 0;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const x = (c - (cols - 1) / 2) * spacing + (Math.random() - 0.5) * jitter;
        const z = (r - (rows - 1) / 2) * spacing + (Math.random() - 0.5) * jitter;
        const y = 0;
        dummy.position.set(x, y, z);
        dummy.rotation.y = (Math.random() - 0.5) * 0.35;
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        const isCommander = r === 0 && c === Math.floor(cols / 2);
        mesh.setColorAt(i, isCommander ? commanderColor : baseColor);
        i += 1;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [rows, cols, spacing, jitter, baseColor, commanderColor, dummy]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        Math.sin(performance.now() * 0.0001) * 0.08,
        0.05
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, rows * cols]}
        castShadow
        receiveShadow
      />
    </group>
  );
};

const Dust = ({ count = 200 }) => {
  const pointsRef = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = Math.random() * 3 + 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) return;
    const pos = points.geometry.attributes.position;
    for (let i = 0; i < count; i += 1) {
      let y = pos.array[i * 3 + 1];
      y += delta * 0.15;
      if (y > 4) y = 0.2;
      pos.array[i * 3 + 1] = y;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#f2c28f" size={0.03} transparent opacity={0.35} />
    </points>
  );
};

const TerracottaArmyCanvas = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [7, 6, 9], fov: 45, near: 0.1, far: 60 }}
      dpr={[1, 2]}
    >
      <color attach="background" args={["#05070f"]} />
      <fog attach="fog" args={["#05070f", 8, 26]} />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[7, 10, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <spotLight
        position={[-6, 8, -4]}
        angle={0.55}
        penumbra={0.25}
        intensity={0.8}
        color="#c08457"
      />

      <Suspense fallback={null}>
        <SoldierInstances />
        <Dust />
      </Suspense>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 28, 1, 1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.02} />
      </mesh>

      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        maxDistance={20}
        minDistance={5}
        target={[0, 1, 0]}
      />
    </Canvas>
  );
};

export default TerracottaArmyCanvas;
