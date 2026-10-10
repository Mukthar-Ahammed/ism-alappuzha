"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { TimelineStep } from "@/components/ui/TimelineStep";
import { namazSteps, rakahData, scholarNote, RakahInfo } from "@/data/namaz";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

export const NamazGuide: React.FC = () => {
  const [selectedRakah, setSelectedRakah] = useState<RakahInfo | null>(null);
  const [lineHeightPx, setLineHeightPx] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<Record<string, "hidden" | "active" | "done">>({});

  const timelineRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Niyyah (Step 1) is rendered separately at the top
  const niyyahStep = namazSteps[0];
  // Timeline steps are Steps 2 through 12
  const timelineSteps = useMemo(() => namazSteps.slice(1), []);
  const totalSteps = namazSteps.length;

  // Scroll handler: calculates timeline fill height & step statuses outside JSX render
  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const viewportTriggerLine = window.innerHeight * 0.65;

      const currentFilledPx = viewportTriggerLine - rect.top;
      const clampedFilledPx = Math.max(0, Math.min(rect.height, currentFilledPx));
      setLineHeightPx((prev) => (Math.abs(prev - clampedFilledPx) > 1 ? clampedFilledPx : prev));

      const newStatuses: Record<string, "hidden" | "active" | "done"> = {};

      timelineSteps.forEach((step) => {
        const el = document.getElementById(`namaz-step-${step.id}`);
        if (el) {
          const cardTopRelativeToTimeline =
            el.getBoundingClientRect().top - rect.top;
          const cardBottomRelativeToTimeline =
            cardTopRelativeToTimeline + el.clientHeight;

          if (clampedFilledPx >= cardTopRelativeToTimeline - 40) {
            if (clampedFilledPx >= cardBottomRelativeToTimeline - 40) {
              newStatuses[step.id] = "done";
            } else {
              newStatuses[step.id] = "active";
            }
          } else {
            newStatuses[step.id] = "hidden";
          }
        }
      });

      setStepStatuses((prev) => {
        let changed = false;
        for (const key in newStatuses) {
          if (prev[key] !== newStatuses[key]) {
            changed = true;
            break;
          }
        }
        return changed ? newStatuses : prev;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [timelineSteps]);

  return (
    <section id="namaz" className="py-20 md:py-28 bg-bg font-body text-text-main overflow-hidden">
      <Container>
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
            Prayer Guidance & Steps
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-primary tracking-tight mt-1">
            How to Perform Namaz
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-muted">
            Scroll to follow the prayer flow, step by step.
          </p>
        </div>

        {/* 1. NIYYAH (INTENTION) — Featured at Top (No Stickman Figure, No Timeline Scroll Animation) */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-white rounded-[22px] p-6 sm:p-8 border border-secondary/40 shadow-floating relative overflow-hidden">
            {/* Top Accent Strip */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-secondary via-secondary-hover to-primary" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="bg-secondary text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Step 1 • Foundation
                </span>
              </div>
              <h3 className="font-display text-2xl font-bold text-primary">
                {niyyahStep.name}
              </h3>
            </div>

            <p className="mt-4 text-sm sm:text-base text-text-main font-medium leading-relaxed">
              {niyyahStep.whatToDo}
            </p>

            {/* Arabic Text */}
            <div className="mt-5 p-4 rounded-xl bg-primary-tint border border-primary/10 text-right">
              <p className="font-arabic text-2xl sm:text-3xl text-primary leading-loose dir-rtl">
                {niyyahStep.arabic}
              </p>
              <p className="mt-2 text-xs sm:text-sm text-secondary font-medium font-body text-left">
                <span className="font-bold text-primary">Transliteration:</span> {niyyahStep.transliteration}
              </p>
            </div>

            {/* Malayalam Explanation Placeholder */}
            <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-text-muted font-malayalam">
              <span className="font-bold text-primary block mb-1">മലയാളം രൂപം:</span>
              <p>{niyyahStep.malayalam}</p>
            </div>

            {/* Do and Don't Guidance */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-primary/10">
              <div className="space-y-1.5">
                <span className="font-bold text-primary flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <span className="text-emerald-600 font-extrabold">✓</span> Recommended (Do):
                </span>
                <ul className="space-y-1 text-text-muted pl-4 list-disc">
                  {niyyahStep.dos.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-primary flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <span className="text-red-500 font-extrabold">✕</span> Avoid (Don&apos;t):
                </span>
                <ul className="space-y-1 text-text-muted pl-4 list-disc">
                  {niyyahStep.donts.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Divider & Subheading for Prayer Flow Timeline */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest">
            Prayer Sequence Timeline (Steps 2 — 12)
          </span>
          <p className="text-xs text-text-muted mt-1">
            As you scroll down, the gold timeline line reveals each posture card when reached.
          </p>
        </div>

        {/* 2. CENTERED TIMELINE & CARDS (Steps 2 to 12) */}
        <div ref={timelineRef} className="max-w-3xl mx-auto relative pl-4 sm:pl-6">
          {/* Vertical Timeline Grey Line & Gold Fill Line */}
          <div className="absolute left-[13px] sm:left-[17px] top-4 bottom-4 w-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="w-full bg-secondary rounded-full transition-all duration-150 ease-out"
              style={{
                height: prefersReducedMotion ? "100%" : `${lineHeightPx}px`,
              }}
            />
          </div>

          {/* Timeline Cards Stack */}
          <div className="space-y-12 sm:space-y-16">
            {timelineSteps.map((step) => {
              const status = prefersReducedMotion
                ? "active"
                : stepStatuses[step.id] || "hidden";

              return (
                <TimelineStep
                  key={step.id}
                  step={step}
                  status={status}
                  totalSteps={totalSteps}
                />
              );
            })}
          </div>
        </div>

        {/* After the Timeline: Rakahs Count Strip */}
        <div className="mt-20 max-w-3xl mx-auto p-8 rounded-[22px] bg-primary-tint border border-primary/10 shadow-soft">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-xl font-bold text-primary">
                How many Rakahs?
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Tap a prayer to view its specific Rakah structure and Tashahhud positions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {rakahData.map((rakah) => (
                <button
                  key={rakah.name}
                  type="button"
                  onClick={() => setSelectedRakah(rakah)}
                  className="px-4 py-2 rounded-full bg-white border border-primary/15 text-primary hover:border-secondary hover:bg-secondary-tint text-xs font-semibold shadow-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  <span className="font-bold">{rakah.name}:</span> {rakah.rakahs} Rakahs
                </button>
              ))}
            </div>
          </div>

          {/* Rakah Details Panel */}
          {selectedRakah && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-5 rounded-xl bg-white border border-secondary/30 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold text-primary">
                  {selectedRakah.name} Prayer ({selectedRakah.description})
                </span>
                <button
                  onClick={() => setSelectedRakah(null)}
                  className="text-xs text-text-muted hover:text-primary"
                >
                  Close ✕
                </button>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-text-main leading-relaxed">
                {selectedRakah.details}
              </p>
            </motion.div>
          )}
        </div>

        {/* Mandatory Scholar Audit Note */}
        <div className="mt-12 text-center text-xs text-text-muted italic border-t border-primary/10 pt-6 max-w-2xl mx-auto">
          <p>{scholarNote}</p>
        </div>
      </Container>
    </section>
  );
};
