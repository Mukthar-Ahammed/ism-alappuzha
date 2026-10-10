"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TransformState {
  opacity: number;
}

interface GoldParticlesProps {
  transformRef: React.MutableRefObject<TransformState>;
}

// Deterministic pseudo-random number generator to ensure React hook purity
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

export const GoldParticles: React.FC<GoldParticlesProps> = ({
  transformRef,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const count = 35;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (pseudoRandom(i * 3 + 1) - 0.5) * 8;
      pos[i * 3 + 1] = (pseudoRandom(i * 3 + 2) - 0.5) * 6;
      pos[i * 3 + 2] = (pseudoRandom(i * 3 + 3) - 0.5) * 4;
    }

    return pos;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.getElapsedTime();
      pointsRef.current.rotation.y = time * 0.03;
      pointsRef.current.rotation.x = Math.sin(time * 0.02) * 0.05;
    }

    if (materialRef.current && transformRef.current) {
      const op = transformRef.current.opacity ?? 1;
      materialRef.current.opacity = op * 0.6;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.08}
        color="#C9A24B"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
