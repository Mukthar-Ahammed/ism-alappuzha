"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ModelPoster } from "@/components/3d/ModelPoster";

// three.js and the model load only once the page is idle; the poster covers the wait.
const HeroQuranCanvas = dynamic(() => import("@/components/3d/HeroQuranCanvas"), { ssr: false });

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/** The live model is skipped where it would cost more than it adds. */
function canShowLiveModel(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;

  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "")) return false;

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (memory !== undefined && memory < 4) return false;

  try {
    return Boolean(document.createElement("canvas").getContext("webgl"));
  } catch {
    return false;
  }
}

/** Runs once the page has loaded and the browser has a quiet moment. */
function whenIdle(callback: () => void): () => void {
  let idleId: number | undefined;
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const schedule = () => {
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(callback, { timeout: 2500 });
    } else {
      timerId = setTimeout(callback, 1200);
    }
  };

  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener("load", schedule, { once: true });
  }

  return () => {
    window.removeEventListener("load", schedule);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    clearTimeout(timerId);
  };
}

export const HeroQuran: React.FC<{ className?: string }> = ({
  className = "h-[280px] min-[400px]:h-[320px] sm:h-[460px] lg:h-[520px]",
}) => {
  const [loadModel, setLoadModel] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    if (!canShowLiveModel()) return;

    return whenIdle(() => setLoadModel(true));
  }, []);

  return (
    <div className={`relative mx-auto w-full max-w-[520px] ${className}`}>
      <ModelPoster
        className={`absolute inset-0 transition-opacity duration-700 ${modelReady ? "opacity-0" : "opacity-100"}`}
      />
      {loadModel && (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${modelReady ? "opacity-100" : "opacity-0"}`}
        >
          <HeroQuranCanvas onReady={() => setModelReady(true)} />
        </div>
      )}
    </div>
  );
};
