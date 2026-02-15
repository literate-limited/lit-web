import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { saturationToColor } from "../state/colors.js";

function HeartMesh({ saturation = 75, colorBlind, heartRate, reducedMotion }) {
  const groupRef = useRef();
  const color = useMemo(() => saturationToColor(saturation, colorBlind), [saturation, colorBlind]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const bpm = heartRate || 72;
    const beat = Math.sin((t * bpm * Math.PI) / 30); // bpm / 60 * 2pi -> scaled
    const scale = reducedMotion ? 1 : 1 + 0.04 * Math.max(0, beat);
    groupRef.current.scale.set(scale, scale, scale);
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <sphereGeometry args={[1.1, 42, 32]} />
        <meshStandardMaterial color={color} metalness={0.25} roughness={0.3} />
      </mesh>
      <mesh position={[-0.9, -0.5, 0]} scale={[0.9, 0.9, 0.9]}>
        <sphereGeometry args={[1, 36, 28]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.38} />
      </mesh>
    </group>
  );
}

export default function HeartScene({ saturation, heartRate, colorBlind, reducedMotion, onPump }) {
  return (
    <div className="hof-card">
      <div className="hof-card__header">
        <p className="hof-kicker">Heart Chambers</p>
        <h2 className="hof-card__title">4-chamber pulse</h2>
      </div>
      <div className="hof-actions">
        <button
          type="button"
          className="hof-button hof-button--ghost"
          onClick={onPump}
          disabled={!onPump}
          aria-label="Pump the heart (temporary heart-rate boost)"
        >
          Pump
        </button>
      </div>
      <div
        className="hof-canvas"
        tabIndex={0}
        aria-label="Animated heart model showing chamber pulsation and oxygen saturation colour"
      >
        <Canvas shadows camera={{ position: [0, 2.4, 4.5], fov: 55 }}>
          <color attach="background" args={["#05060a"]} />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[4, 6, 5]}
            intensity={1.05}
            castShadow
            shadow-mapSize-height={1024}
            shadow-mapSize-width={1024}
          />
          <spotLight position={[-5, 6, -4]} intensity={0.4} />
          <HeartMesh
            saturation={saturation}
            heartRate={heartRate}
            colorBlind={colorBlind}
            reducedMotion={reducedMotion}
          />
          <OrbitControls enablePan={false} enableZoom={!reducedMotion} />
        </Canvas>
      </div>
    </div>
  );
}
