"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { QuranModel } from "@/components/3d/QuranModel";
import { GoldParticles } from "@/components/3d/GoldParticles";
import { ModelPoster } from "@/components/3d/ModelPoster";
import { sceneConfig, type Transform3D } from "@/data/scene";

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

export const SceneCanvas: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [webglSupported] = useState<boolean>(() => checkWebglSupport());
  const [reducedMotion] = useState<boolean>(() => checkReducedMotion());
  const [isDesktop, setIsDesktop] = useState(true);

  // Active transform state ref updated by GSAP ScrollTrigger for Hero section
  const transformRef = useRef<Transform3D & { openProgress: number }>({
    x: sceneConfig[0].desktop.x,
    y: sceneConfig[0].desktop.y,
    z: sceneConfig[0].desktop.z,
    rotX: sceneConfig[0].desktop.rotX,
    rotY: sceneConfig[0].desktop.rotY,
    rotZ: sceneConfig[0].desktop.rotZ,
    scale: sceneConfig[0].desktop.scale,
    opacity: 1,
    openProgress: 0,
  });

  // Mouse normalized position (-1 to 1) for parallax
  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion || !webglSupported) return;

    // Check desktop width
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 860);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Mouse move parallax listener
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePosRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Lazy load canvas after first paint
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timer);
    };
  }, [reducedMotion, webglSupported]);

  // Set up GSAP ScrollTrigger animation for Hero section ONLY
  useEffect(() => {
    if (!mounted || reducedMotion || !webglSupported) return;

    gsap.registerPlugin(ScrollTrigger);

    const isDesk = window.innerWidth >= 860;
    const initialConfig = isDesk ? sceneConfig[0].desktop : sceneConfig[0].mobile;

    transformRef.current = {
      ...initialConfig,
      opacity: 1,
      openProgress: 0,
    };

    const ctx = gsap.context(() => {
      const heroElem = document.getElementById("top");
      if (!heroElem) return;

      // As user scrolls out of Hero (#top), fade out the 3D model smoothly
      gsap.to(transformRef.current, {
        opacity: 0,
        y: initialConfig.y + 0.5,
        scale: initialConfig.scale * 0.8,
        ease: "power1.out",
        scrollTrigger: {
          trigger: "#top",
          start: "center top",
          end: "bottom top",
          scrub: 0.5,
        },
      });
    });

    return () => ctx.revert();
  }, [mounted, reducedMotion, webglSupported]);

  // Fallback for low-power / no webgl / reduced motion
  if (reducedMotion || !webglSupported) {
    return (
      <div className="absolute top-12 right-6 z-10 hidden md:block">
        <ModelPoster />
      </div>
    );
  }

  if (!mounted) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-10 pointer-events-none select-none transition-opacity duration-700"
      aria-hidden="true"
      style={{ opacity: isLoaded ? 1 : 0 }}
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 1.75]}
        onCreated={() => setIsLoaded(true)}
      >
        {/* Soft Ambient & Directional Warm Lighting */}
        <ambientLight intensity={1.2} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={2.5}
          color="#FAF3E0"
          castShadow
        />
        <directionalLight
          position={[-5, -4, -3]}
          intensity={0.6}
          color="#C9A24B"
        />

        {/* Floating Gold Particles in Hero */}
        <GoldParticles transformRef={transformRef} />

        {/* Soft Contact Shadow beneath model */}
        <ContactShadows
          position={[0, -2.2, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={4}
          color="#10241E"
        />

        {/* 3D Quran Model */}
        <Suspense fallback={null}>
          <QuranModel
            transformRef={transformRef}
            mousePosRef={mousePosRef}
            isDesktop={isDesktop}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
