"use client";

import React, { useEffect } from "react";
import type Lenis from "lenis";

export const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    // Smooth wheel scrolling only: phones and tablets keep native touch scrolling,
    // and people who ask for reduced motion get the browser default.
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    let lenis: Lenis | null = null;
    let cancelled = false;

    // Loaded after the page is interactive so it never delays the first render.
    void import("lenis").then(({ default: LenisScroll }) => {
      if (cancelled) return;

      lenis = new LenisScroll({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        autoRaf: true,
      });
    });

    return () => {
      cancelled = true;
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
};
