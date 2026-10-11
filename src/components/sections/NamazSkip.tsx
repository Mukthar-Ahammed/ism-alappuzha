"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { defineCopy, useCopy } from "@/lib/i18n/locale";

const copy = defineCopy({
  en: {
    skipGuide: "Skip the step-by-step guide",
    skipTo: (label: string) => `Skip to ${label}`,
  },
  ml: {
    skipGuide: "ഘട്ടം ഘട്ടമായുള്ള ഗൈഡ് ഒഴിവാക്കുക",
    skipTo: (label: string) => `${label} എന്നതിലേക്ക് പോകുക`,
  },
});

/** Scrolls to the section after the guide and moves keyboard focus there. */
function skipTo(sectionId: string): void {
  const target = document.getElementById(sectionId);

  if (!target) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });

  if (!target.hasAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
  }
  target.focus({ preventScroll: true });
}

const ArrowDown: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m0 0l-6-6m6 6l6-6" />
  </svg>
);

type NamazSkipProps = {
  /** The guide section; the floating button shows only while the reader is inside it. */
  sectionRef: React.RefObject<HTMLElement | null>;
  /** The end of the long part (the rakah strip); the button hides once it is in view. */
  endRef: React.RefObject<HTMLElement | null>;
  nextSectionId: string;
  nextSectionLabel: string;
};

/**
 * "Skip" controls for the long Namaz guide: a visible link under the heading, and a
 * floating button that appears while scrolling through the steps.
 */
export const NamazSkip: React.FC<NamazSkipProps & { placement: "inline" | "floating" }> = ({
  sectionRef,
  endRef,
  nextSectionId,
  nextSectionLabel,
  placement,
}) => {
  const t = useCopy(copy);
  const [floatingVisible, setFloatingVisible] = useState(false);

  useEffect(() => {
    if (placement !== "floating") return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current?.getBoundingClientRect();
      const end = endRef.current?.getBoundingClientRect();

      if (!section || !end) return;

      // Past the heading and the first card, and the end of the steps not yet reached.
      const inside = section.top < -320 && end.top > window.innerHeight * 0.75;
      setFloatingVisible((previous) => (previous === inside ? previous : inside));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [placement, sectionRef, endRef]);

  if (placement === "inline") {
    return (
      <button
        type="button"
        onClick={() => skipTo(nextSectionId)}
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/15 bg-white px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      >
        {t.skipGuide}
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-4 transition-all duration-300 sm:bottom-8",
        floatingVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
    >
      <button
        type="button"
        onClick={() => skipTo(nextSectionId)}
        tabIndex={floatingVisible ? 0 : -1}
        aria-hidden={!floatingVisible}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-floating ring-1 ring-secondary/40 transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
          floatingVisible && "pointer-events-auto"
        )}
      >
        {t.skipTo(nextSectionLabel)}
        <ArrowDown className="h-4 w-4 text-secondary" />
      </button>
    </div>
  );
};
