import { useEffect, useMemo, useRef } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import vertexShader from "../shaders/liquid.vert?raw";
import fragmentShader from "../shaders/liquid.frag?raw";

const LiquidMaterial = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(1, 1),
    uMouse: new THREE.Vector2(0.5, 0.5),
  },
  vertexShader,
  fragmentShader,
);

extend({ LiquidMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    liquidMaterial: ThreeElements["shaderMaterial"];
  }
}

type LiquidUniforms = THREE.ShaderMaterial & {
  uTime: number;
  uResolution: THREE.Vector2;
  uMouse: THREE.Vector2;
};

function LiquidPlane() {
  const materialRef = useRef<LiquidUniforms>(null);
  const { viewport, size } = useThree();
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));
  const reducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      targetMouse.current.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    };
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  useFrame((_, delta) => {
    const material = materialRef.current;
    if (!material) return;

    material.uResolution.set(size.width, size.height);

    mouse.current.lerp(targetMouse.current, 0.03);
    material.uMouse.copy(mouse.current);

    if (!reducedMotion) {
      material.uTime += delta;
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      {/* @ts-expect-error — liquidMaterial is registered via extend() above */}
      <liquidMaterial ref={materialRef} />
    </mesh>
  );
}

export default function HeroBackground() {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <Canvas
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        dpr={[1, 2]}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <PerformanceMonitor>
          <AdaptiveDpr pixelated />
          <LiquidPlane />
        </PerformanceMonitor>
      </Canvas>
    </div>
  );
}
