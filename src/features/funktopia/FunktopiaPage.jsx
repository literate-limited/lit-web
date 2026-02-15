import { useMemo, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import ExportPanel from "./components/ExportPanel";
import GeneratorSelector, { GENERATORS } from "./components/GeneratorSelector";
import ParameterControls from "./components/ParameterControls";
import PresetSelector from "./components/PresetSelector";
import { CoasterGenerator } from "./generators/CoasterGenerator";
import { SurfaceGenerator } from "./generators/SurfaceGenerator";
import { PrimitiveGenerator } from "./generators/PrimitiveGenerator";

function GeneratedMesh({ generator, params }) {
  const geometry = useMemo(() => {
    generator.setParameters(params);
    return generator.generate();
  }, [generator, params]);

  // Different materials based on generator type
  const material = useMemo(() => {
    if (generator.name === 'Coaster') {
      return (
        <meshStandardMaterial color="#ff7f0e" metalness={0.35} roughness={0.5} />
      );
    } else if (generator.name === 'Surface') {
      return (
        <meshStandardMaterial
          color="#3b82f6"
          metalness={0.2}
          roughness={0.7}
          side={THREE.DoubleSide}
        />
      );
    } else if (generator.name === 'Primitive') {
      return (
        <meshStandardMaterial color="#a855f7" metalness={0.1} roughness={0.8} />
      );
    }
    return <meshStandardMaterial />;
  }, [generator.name]);

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        {material}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -15, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <gridHelper args={[80, 40, "#1d4ed8", "#0ea5e9"]} position={[0, -14.99, 0]} />
    </group>
  );
}

const FunktopiaPage = () => {
  // Generator management
  const [generatorId, setGeneratorId] = useState('coaster');
  const [presetId, setPresetId] = useState('kingda');

  // Create generator instance
  const generator = useMemo(() => {
    const GeneratorClass = GENERATORS.find(g => g.id === generatorId)?.class;
    return GeneratorClass ? new GeneratorClass() : new CoasterGenerator();
  }, [generatorId]);

  // Initialize with generator's default parameters
  const [params, setParams] = useState(generator.getParameters());

  // Scene ref for export
  const sceneRef = useRef();

  // Update parameter
  const updateParam = (key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // Apply preset
  const applyPreset = (id, presetParams) => {
    setPresetId(id);
    setParams(presetParams);
  };

  // Switch generator
  const handleGeneratorChange = (newGeneratorId) => {
    setGeneratorId(newGeneratorId);
    const GeneratorClass = GENERATORS.find(g => g.id === newGeneratorId)?.class;
    if (GeneratorClass) {
      const newGen = new GeneratorClass();
      setParams(newGen.getParameters());
      const presets = newGen.getPresets();
      setPresetId(presets.length > 0 ? presets[0].id : null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-950 text-slate-100">
      <div className="w-80 p-4 space-y-4 border-r border-slate-800 bg-slate-900/70 overflow-y-auto">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Funktopia</p>
          <h1 className="text-xl font-semibold">3D Generator</h1>
          <p className="text-xs text-slate-400">
            Create 3D assets using mathematical functions and parametric equations.
          </p>
        </div>

        <GeneratorSelector
          currentGeneratorId={generatorId}
          onSelectGenerator={handleGeneratorChange}
        />

        <PresetSelector
          generator={generator}
          currentPresetId={presetId}
          onApplyPreset={applyPreset}
        />

        <ParameterControls
          generator={generator}
          params={params}
          onUpdateParam={updateParam}
        />

        <ExportPanel sceneRef={sceneRef} params={params} generator={generator} />
      </div>

      <div className="flex-1 relative">
        <Canvas shadows camera={{ position: [35, 20, 35], fov: 45 }} onCreated={({ scene }) => { sceneRef.current = scene; }}>
          <color attach="background" args={["#020617"]} />
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[25, 35, 25]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <GeneratedMesh generator={generator} params={params} />
          <OrbitControls enableDamping dampingFactor={0.08} target={[0, 0, 0]} />
        </Canvas>

        <div className="pointer-events-none absolute left-4 bottom-4 bg-slate-900/70 border border-cyan-500/30 rounded-xl px-4 py-3 text-xs shadow-lg shadow-cyan-500/10 backdrop-blur">
          <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-300">Funktopia</p>
          <p className="font-semibold">{generator.name} Generator</p>
          <p className="text-[11px] text-slate-400">
            {generator.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FunktopiaPage;
