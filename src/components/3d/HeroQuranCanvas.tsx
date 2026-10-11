"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

export const MODEL_PATH = "/models/quran_3d_free.glb";

/** Camera distance that frames the book on wide (desktop) canvases. */
const baseCameraZ = 5.5;
/** Below this width:height ratio the camera backs off so the whole book stays in frame. */
const minAspectForBaseZ = 0.85;

interface QuranMeshProps {
  mousePosRef: React.MutableRefObject<{ x: number; y: number }>;
  onReady: () => void;
}

const QuranMesh: React.FC<QuranMeshProps> = ({ mousePosRef, onReady }) => {
  const groupRef = useRef<THREE.Group>(null);
  const floatGroupRef = useRef<THREE.Group>(null);
  const readyRef = useRef(false);
  const { scene } = useGLTF(MODEL_PATH);

  // Normalize scale and center pivot point on mount
  useEffect(() => {
    if (!scene) return;

    // useGLTF caches the scene, and this effect can run more than once (remounts, Strict
    // Mode), so measure from the untransformed model each time. Measuring an already
    // scaled scene would compute a scale of ~1 and shrink the book to its raw size.
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    const bbox = new THREE.Box3().setFromObject(scene);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const normalizedScale = 2.75 / maxDim;

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

  // Base default rotation: cover tipped toward the viewer at a three-quarter angle,
  // page edges showing on the lower left (fitted to the approved hero reference).
  const defaultRotX = 0.95;
  const defaultRotY = -0.62;
  const defaultRotZ = 0.13;

  // Gentle hovering / bobbing animation and subtle mouse tilt
  useFrame((state, delta) => {
    if (!floatGroupRef.current) return;
    const time = state.clock.elapsedTime;

    // The model has been drawn at least once: the poster underneath can fade out.
    if (!readyRef.current) {
      readyRef.current = true;
      onReady();
    }

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

/** Backs the camera off on narrow canvases (phones) so the tilted book is never cropped. */
const ResponsiveCamera: React.FC = () => {
  const getState = useThree((state) => state.get);
  const aspect = useThree((state) => state.size.width / Math.max(1, state.size.height));

  useEffect(() => {
    const { camera } = getState();
    camera.position.z = aspect >= minAspectForBaseZ ? baseCameraZ : (baseCameraZ * minAspectForBaseZ) / aspect;
    camera.updateProjectionMatrix();
  }, [getState, aspect]);

  return null;
};

/** The live 3D scene. HeroQuran loads it on demand and shows a still until onReady fires. */
export default function HeroQuranCanvas({ onReady }: { onReady: () => void }) {
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [finePointer] = useState(() => window.matchMedia("(pointer: fine)").matches);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePosRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, baseCameraZ], fov: 42 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.75]}
      className={finePointer ? "cursor-grab active:cursor-grabbing" : undefined}
    >
      <ResponsiveCamera />

      {/* Lighting */}
      <ambientLight intensity={1.3} />
      <directionalLight position={[5, 8, 5]} intensity={2.6} color="#FAF3E0" castShadow />
      <directionalLight position={[-5, -4, -3]} intensity={0.6} color="#C9A24B" />

      {/* Drag to rotate with a mouse. Touch screens skip it so a swipe over the book scrolls the page. */}
      {finePointer && (
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.8}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={(3 * Math.PI) / 4}
        />
      )}

      {/* Soft Contact Shadow beneath model */}
      <ContactShadows position={[0, -1.8, 0]} opacity={0.45} scale={8} blur={2.2} far={3.5} color="#10241E" />

      {/* 3D Quran Mesh */}
      <Suspense fallback={null}>
        <QuranMesh mousePosRef={mousePosRef} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
