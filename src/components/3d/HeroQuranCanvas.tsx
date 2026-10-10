"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { ModelPoster } from "@/components/3d/ModelPoster";

export const MODEL_PATH = "/models/quran_3d_free.glb";

interface QuranMeshProps {
  mousePosRef: React.MutableRefObject<{ x: number; y: number }>;
}

const QuranMesh: React.FC<QuranMeshProps> = ({ mousePosRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const floatGroupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_PATH);

  // Normalize scale and center pivot point on mount
  useEffect(() => {
    if (!scene) return;

    const bbox = new THREE.Box3().setFromObject(scene);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const normalizedScale = 2.4 / maxDim;

    scene.position.set(
      -center.x * normalizedScale,
      -center.y * normalizedScale,
      -center.z * normalizedScale
    );

    scene.scale.set(normalizedScale, normalizedScale, normalizedScale);

    // Apply soft material tweaks (gold tint highlights for metal/accents)
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.envMapIntensity = 1.2;
          mat.roughness = Math.min(mat.roughness || 0.4, 0.5);
        }
      }
    });
  }, [scene]);

  // Base default rotation (tilted 3D view showing cover, gold trim & depth)
  const defaultRotX = 0.25;
  const defaultRotY = -0.45;
  const defaultRotZ = 0.08;

  // Gentle hovering / bobbing animation and subtle mouse tilt
  useFrame((state, delta) => {
    if (!floatGroupRef.current) return;
    const time = state.clock.elapsedTime;

    // Soft floating bobbing up and down
    floatGroupRef.current.position.y = Math.sin(time * 1.5) * 0.12;

    // Subtle mouse tilt effect added onto default rotation pose
    const targetTiltX = mousePosRef.current.y * 0.12;
    const targetTiltY = mousePosRef.current.x * 0.12;
    const lerpSpeed = Math.min(delta * 4, 1);

    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        defaultRotX + targetTiltX,
        lerpSpeed
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        defaultRotY + targetTiltY,
        lerpSpeed
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        defaultRotZ + Math.sin(time * 0.8) * 0.02,
        lerpSpeed
      );
    }
  });

  return (
    <group ref={groupRef} rotation={[defaultRotX, defaultRotY, defaultRotZ]}>
      <group ref={floatGroupRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
};

// Preload the model asset
useGLTF.preload(MODEL_PATH);

function checkWebglSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!gl;
  } catch {
    return false;
  }
}

function checkReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const HeroQuranCanvas: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [webglSupported] = useState<boolean>(() => checkWebglSupport());
  const [reducedMotion] = useState<boolean>(() => checkReducedMotion());
  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion || !webglSupported) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePosRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const timer = setTimeout(() => {
      setMounted(true);
    }, 50);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timer);
    };
  }, [reducedMotion, webglSupported]);

  if (reducedMotion || !webglSupported) {
    return <ModelPoster />;
  }

  if (!mounted) {
    return <ModelPoster />;
  }

  return (
    <div className="relative w-full h-[360px] sm:h-[460px] lg:h-[520px] flex items-center justify-center">
      <div
        className="w-full h-full transition-opacity duration-700 cursor-grab active:cursor-grabbing"
        style={{ opacity: isLoaded ? 1 : 0 }}
      >
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 42 }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          dpr={[1, 1.75]}
          onCreated={() => setIsLoaded(true)}
        >
          {/* Lighting */}
          <ambientLight intensity={1.3} />
          <directionalLight
            position={[5, 8, 5]}
            intensity={2.6}
            color="#FAF3E0"
            castShadow
          />
          <directionalLight
            position={[-5, -4, -3]}
            intensity={0.6}
            color="#C9A24B"
          />

          {/* Interactive OrbitControls to rotate model with mouse/touch */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.8}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={(3 * Math.PI) / 4}
          />

          {/* Soft Contact Shadow beneath model */}
          <ContactShadows
            position={[0, -1.8, 0]}
            opacity={0.45}
            scale={8}
            blur={2.2}
            far={3.5}
            color="#10241E"
          />

          {/* 3D Quran Mesh */}
          <Suspense fallback={null}>
            <QuranMesh mousePosRef={mousePosRef} />
          </Suspense>
        </Canvas>
      </div>

      {/* Floating hint pill */}
      <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
        <span className="px-3 py-1 rounded-full bg-white/80 backdrop-blur-md text-[11px] font-semibold text-text-muted border border-border-subtle/50 shadow-xs">
          ✋ Drag cursor to rotate 3D Quran
        </span>
      </div>
    </div>
  );
};
