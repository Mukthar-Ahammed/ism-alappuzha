"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

interface TransformState {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  opacity: number;
  openProgress: number; // 0 (closed) to 1 (open)
}

interface QuranModelProps {
  transformRef: React.MutableRefObject<TransformState>;
  mousePosRef: React.MutableRefObject<{ x: number; y: number }>;
  isDesktop?: boolean;
}

export const MODEL_PATH = "/models/quran_3d_free.glb";

export const QuranModel: React.FC<QuranModelProps> = ({
  transformRef,
  mousePosRef,
  isDesktop = true,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const wrapperRef = useRef<THREE.Group>(null);

  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions } = useAnimations(animations, groupRef);

  // Normalize scale and center pivot point on mount
  useLayoutEffect(() => {
    if (!scene) return;

    // Clone scene to avoid mutating cached GLTF
    const bbox = new THREE.Box3().setFromObject(scene);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const normalizedScale = 2.0 / maxDim;

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

  // Handle animation clip if present
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const firstAction = Object.values(actions)[0];
      if (firstAction) {
        firstAction.play();
      }
    }
  }, [actions]);

  // Continuous frame animation & mouse parallax interpolation
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const target = transformRef.current;
    const time = state.clock.getElapsedTime();

    // Mouse parallax tilt (desktop only, max ~8 degrees)
    const targetTiltX = isDesktop ? mousePosRef.current.y * 0.14 : 0;
    const targetTiltY = isDesktop ? mousePosRef.current.x * 0.14 : 0;

    // Idle floating bobbing
    const bobY = Math.sin(time * 1.5) * 0.08;
    const floatRotY = Math.cos(time * 0.8) * 0.05;

    // Smooth Lerp transforms
    const lerpSpeed = Math.min(delta * 6, 1);

    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      target.x,
      lerpSpeed
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      target.y + bobY,
      lerpSpeed
    );
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      target.z,
      lerpSpeed
    );

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      target.rotX + targetTiltX,
      lerpSpeed
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      target.rotY + targetTiltY + floatRotY,
      lerpSpeed
    );
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      target.rotZ,
      lerpSpeed
    );

    const s = THREE.MathUtils.lerp(
      groupRef.current.scale.x,
      target.scale,
      lerpSpeed
    );
    groupRef.current.scale.set(s, s, s);

    // Fade materials
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.transparent = true;
          mat.opacity = THREE.MathUtils.lerp(
            mat.opacity ?? 1,
            target.opacity,
            lerpSpeed
          );
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      <group ref={wrapperRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
};

// Preload the model asset
useGLTF.preload(MODEL_PATH);
