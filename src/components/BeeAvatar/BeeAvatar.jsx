/**
 * BeeAvatar - Breeeeeeeeahnah's 3D Floating Mascot
 *
 * A Pixar-style animated bee that appears, spins, and greets users
 * with her signature introduction.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import './BeeAvatar.css';

function BeeModel({ onAnimationComplete, scaleFactor = 1 }) {
  const group = useRef();
  const { scene, animations } = useGLTF('/breeeeeeeeahnah.glb');
  const { actions, mixer } = useAnimations(animations, group);

  const [phase, setPhase] = useState('entrance'); // entrance -> spinning -> idle
  const [scale, setScale] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [bobOffset, setBobOffset] = useState(0);

  useEffect(() => {
    // Play the built-in animation if available
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = Object.values(actions)[0];
      firstAction.play();
    }

    // Entrance sequence
    const entranceTimer = setTimeout(() => {
      setPhase('spinning');
    }, 800);

    const spinTimer = setTimeout(() => {
      setPhase('idle');
      if (onAnimationComplete) onAnimationComplete();
    }, 2300);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(spinTimer);
    };
  }, [actions, onAnimationComplete]);

  useFrame((state, delta) => {
    if (!group.current) return;

    const time = state.clock.getElapsedTime();

    // Entrance: scale up with bounce
    if (phase === 'entrance') {
      const t = Math.min(time / 0.8, 1);
      const easeOutBounce = t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setScale(easeOutBounce);
    }

    // Spinning: 360° rotation
    if (phase === 'spinning') {
      const spinTime = (time - 0.8) / 1.5; // 1.5s spin duration
      const t = Math.min(spinTime, 1);
      setRotation(t * Math.PI * 2); // Full 360° rotation
    }

    // Idle: gentle floating bob
    if (phase === 'idle') {
      setBobOffset(Math.sin(time * 2) * 0.1);
    }

    // Apply transformations
    const base = 0.035 * scaleFactor;
    group.current.scale.set(scale * base, scale * base, scale * base);
    group.current.rotation.y = rotation;
    group.current.position.y = bobOffset;
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function BeeAvatar({ onClose, onAnimationComplete, ambient = false }) {
  const [showText, setShowText] = useState(false);
  const [closing, setClosing] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [ambientPos, setAmbientPos] = useState({ x: null, y: null });
  const containerRef = useRef(null);
  const ambientSizeRef = useRef({ w: 240, h: 240 });
  const ambientPosRef = useRef({ x: 0, y: 0 });
  const ambientTargetRef = useRef({ x: 0, y: 0 }); // orbit center (cursor + offset)
  const ambientLastTsRef = useRef(0);
  const ambientSeedRef = useRef(Math.random() * 1000);
  const ambientRafRef = useRef(0);
  const ambientReadyRef = useRef(false);

  useEffect(() => {
    // Show text after entrance animation (unless ambient mode)
    const textTimer = setTimeout(() => {
      if (!ambient) {
        setShowText(true);
      }
    }, 2000);

    // Auto-close after greeting (unless ambient mode)
    let closeTimer;
    if (!ambient) {
      closeTimer = setTimeout(() => {
        handleClose();
      }, 8000);
    }

    return () => {
      clearTimeout(textTimer);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [ambient]);

  useEffect(() => {
    if (!ambient) return undefined;

    const startX = Math.max(window.innerWidth - 220, 120);
    const startY = 120;
    ambientPosRef.current = { x: startX, y: startY };
    ambientTargetRef.current = { x: startX, y: startY };
    setAmbientPos({ x: startX, y: startY });

    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        ambientSizeRef.current = { w: rect.width, h: rect.height };
      }
    };

    // Measure once after mount and keep it reasonably fresh on resize.
    measure();
    window.addEventListener("resize", measure);

    const enableFollowTimer = setTimeout(() => {
      ambientReadyRef.current = true;
    }, 900);

    const handleMouseMove = (event) => {
      if (!ambientReadyRef.current) return;
      // Keep the fairy near (but not directly on) the cursor so it doesn't block clicks.
      const offsetX = 90;
      const offsetY = 70;
      ambientTargetRef.current = {
        x: event.clientX + offsetX,
        y: event.clientY + offsetY,
      };
    };

    const animate = () => {
      const now = performance.now();
      const last = ambientLastTsRef.current || now;
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      ambientLastTsRef.current = now;

      // Work in "bee center" space so rotations look right regardless of element size.
      const size = ambientSizeRef.current;
      const halfW = size.w / 2;
      const halfH = size.h / 2;

      const orbitCenter = ambientTargetRef.current;

      const currentTopLeft = ambientPosRef.current;
      const bx = currentTopLeft.x + halfW;
      const by = currentTopLeft.y + halfH;

      const dx = bx - orbitCenter.x;
      const dy = by - orbitCenter.y;
      const dist = Math.max(1, Math.hypot(dx, dy));

      const seed = ambientSeedRef.current;

      // Spiral parameters:
      // - orbitRadius: where we "hover" around the cursor (wonky wobble)
      // - omega: angular speed (rad/s). When far away, period <= 6s.
      const baseOrbitRadius = 110;
      const orbitRadius =
        baseOrbitRadius +
        Math.sin(now * 0.0017 + seed) * 14 +
        Math.sin(now * 0.0032 + seed * 0.7) * 7;

      const omegaMin = (2 * Math.PI) / 6; // <= 6 seconds per full rotation when far away
      const omegaMax = (2 * Math.PI) / 2.4; // cap so it doesn't become a blender
      const omega = Math.min(omegaMax, omegaMin + dist / 900);

      // Radial spring pulls the fairy toward the orbit radius (spiral-in when far).
      const kRadial = 2.4; // 1/s
      const radialError = dist - orbitRadius;

      const ux = dx / dist;
      const uy = dy / dist;
      const tx = -uy; // tangential unit (CCW)
      const ty = ux;

      let vx = (-kRadial * radialError) * ux + (omega * dist) * tx;
      let vy = (-kRadial * radialError) * uy + (omega * dist) * ty;

      // Extra "wonk" so it doesn't look like perfect math.
      const wonk =
        26 +
        Math.min(60, dist * 0.03) +
        Math.sin(now * 0.004 + seed * 1.7) * 10;
      vx += Math.sin(now * 0.0039 + seed * 2.1) * wonk;
      vy += Math.cos(now * 0.0035 + seed * 1.9) * wonk;

      // Keep speeds sane while still meeting the rotation requirement on typical screen distances.
      // Keep this high enough that omegaMin still yields <= 6s rotation on large screens.
      const maxSpeed = 2800;
      const speed = Math.hypot(vx, vy);
      if (speed > maxSpeed) {
        const s = maxSpeed / speed;
        vx *= s;
        vy *= s;
      }

      const nextBx = bx + vx * dt;
      const nextBy = by + vy * dt;

      // Convert back to top-left, clamp within viewport.
      const maxX = window.innerWidth - size.w - 24;
      const maxY = window.innerHeight - size.h - 24;
      const clampedX = Math.min(Math.max(nextBx - halfW, 24), Math.max(24, maxX));
      const clampedY = Math.min(Math.max(nextBy - halfH, 24), Math.max(24, maxY));

      ambientPosRef.current = { x: clampedX, y: clampedY };
      setAmbientPos({ x: clampedX, y: clampedY });
      ambientRafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    ambientRafRef.current = requestAnimationFrame(animate);

    return () => {
      clearTimeout(enableFollowTimer);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(ambientRafRef.current);
      ambientReadyRef.current = false;
    };
  }, [ambient]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 500);
  };

  const handleScaleUp = () => {
    setScaleFactor((prev) => Math.min(prev + 0.15, 3));
  };

  const handleScaleDown = () => {
    setScaleFactor((prev) => Math.max(prev - 0.15, 0.35));
  };

  return (
    <div
      ref={containerRef}
      className={`bee-avatar-container ${ambient ? 'ambient' : ''} ${closing ? 'closing' : ''}`}
      style={
        ambient && ambientPos.x !== null
          ? { left: `${ambientPos.x}px`, top: `${ambientPos.y}px`, right: "auto" }
          : undefined
      }
    >
      {/* 3D Canvas */}
      <div
        className={`bee-canvas-wrapper ${ambient ? 'ambient' : ''}`}
        style={{ pointerEvents: "none" }}
      >
        <Canvas pointerEvents="none">
          <PerspectiveCamera makeDefault position={[0, 0, 5]} />
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-5, -5, -5]} intensity={0.5} color="#ffeb3b" />
          <BeeModel onAnimationComplete={onAnimationComplete} scaleFactor={scaleFactor} />
        </Canvas>
      </div>

      {/* Speech Bubble - hidden in ambient mode unless user clicks */}
      {showText && !ambient && (
        <div className="bee-speech-bubble">
          <p className="bee-greeting">
            <span className="bee-hey">Hey! It's Me!</span>
            <br />
            <span className="bee-name">Breeeeeeeeahnah!</span>
            <br />
            <span className="bee-laugh">Hehehe.</span>
          </p>
          <p className="bee-warning">
            That's <strong>Breeeeeahnah</strong> with{' '}
            <span className="bee-emphasis">7 ees</span> and{' '}
            <span className="bee-emphasis">6 aytches</span>, and if you ever
            spell it wrong I'll be <span className="bee-mad">VERY mad</span>{' '}
            hehehe...
          </p>
          <button className="bee-close-btn" onClick={handleClose}>
            Got it! 🐝
          </button>
        </div>
      )}
    </div>
  );
}
