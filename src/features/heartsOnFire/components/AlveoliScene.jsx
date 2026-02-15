import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { saturationToColor } from "../state/colors.js";

function RBCs({ saturation = 75, colorBlind, reducedMotion }) {
  const count = 28;
  const meshes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        phase: Math.random() * Math.PI * 2,
        radius: 2 + Math.random() * 0.8,
        speed: 0.6 + Math.random() * 0.6,
      })),
    [count]
  );
  const color = useMemo(() => saturationToColor(saturation, colorBlind), [saturation, colorBlind]);
  const group = useRef();

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.children.forEach((child, idx) => {
      const m = meshes[idx];
      const theta = m.phase + t * m.speed * (reducedMotion ? 0.3 : 1);
      child.position.x = Math.cos(theta) * m.radius;
      child.position.y = Math.sin(theta) * m.radius;
      child.position.z = Math.sin(theta * 1.2) * 0.35;
    });
  });

  return (
    <group ref={group}>
      {meshes.map((m) => (
        <mesh key={m.id} position={[0, 0, 0]} scale={[0.14, 0.08, 0.14]}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function AlveoliField({ saturation, colorBlind, reducedMotion }) {
  const sacs = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const angle = (i / 42) * Math.PI * 2;
        const radius = 1.9 + (i % 6) * 0.12;
        return {
          id: i,
          position: [Math.cos(angle) * radius, Math.sin(angle) * radius, (i % 3) * 0.08],
        };
      }),
    []
  );

  return (
    <group>
      {sacs.map((sac) => (
        <mesh key={sac.id} position={sac.position}>
          <sphereGeometry args={[0.22, 24, 16]} />
          <meshStandardMaterial color="#22d3ee" emissive="#0ea5e9" emissiveIntensity={0.3} />
        </mesh>
      ))}
      <RBCs saturation={saturation} colorBlind={colorBlind} reducedMotion={reducedMotion} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <circleGeometry args={[4.2, 48]} />
        <meshStandardMaterial color="#0b1220" />
      </mesh>
    </group>
  );
}

export default function AlveoliScene({ saturation, colorBlind, reducedMotion }) {
  return (
    <div className="hof-card">
      <div className="hof-card__header">
        <p className="hof-kicker">Alveoli</p>
        <h2 className="hof-card__title">Gas exchange bed</h2>
      </div>
      <div
        className="hof-canvas"
        tabIndex={0}
        aria-label="Alveoli field with red blood cells showing oxygen uptake"
      >
        <Canvas shadows camera={{ position: [0, 1.8, 4.2], fov: 50 }}>
          <color attach="background" args={["#030712"]} />
          <ambientLight intensity={0.55} />
          <directionalLight position={[3, 5, 2]} intensity={1} />
          <hemisphereLight args={["#1d4ed8", "#0f172a", 0.7]} />
          <AlveoliField saturation={saturation} colorBlind={colorBlind} reducedMotion={reducedMotion} />
          <OrbitControls enablePan={false} enableZoom={!reducedMotion} />
        </Canvas>
      </div>
    </div>
  );
}
