"use client";

import { RefObject } from "react";
import { useScroll, useTransform, MotionValue } from "framer-motion";

export type ScrollOffset = [string, string];

export interface UseScrollProgressOptions {
  offset?: ScrollOffset;
}

/**
 * Returns a 0-1 MotionValue progress for a given target element's scroll range.
 * Drives scroll-linked animations and Three.js camera rig progression.
 */
export function useScrollProgress(
  targetRef: RefObject<HTMLElement | null>,
  options?: UseScrollProgressOptions
): MotionValue<number> {
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: (options?.offset as ["start start", "end start"]) || ["start start", "end start"],
  });

  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return progress;
}
