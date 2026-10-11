"use client";

import { LazyMotion } from "framer-motion";

const loadFeatures = () => import("@/lib/motion/features").then((module) => module.default);

/**
 * Animations use the lightweight `m` components; their engine loads after the page.
 * `strict` makes a stray full `motion` component fail loudly instead of re-bloating the bundle.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
