"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { m } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { StepGuidance, TimelineStep } from "@/components/ui/TimelineStep";
import {
  rakahData,
  scholarNote,
  scholarNoteMl,
  type PrayerStep,
  type RakahInfo,
} from "@/data/namaz";
import { NamazSkip } from "@/components/sections/NamazSkip";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { defineCopy, useCopy, useLocale } from "@/lib/i18n/locale";

const copy = defineCopy({
  en: {
    eyebrow: "Prayer Guidance & Steps",
    title: "How to Perform Namaz",
    intro: "Scroll to follow the prayer flow, step by step.",
    nextSection: "Dhikr & Dua",
    stepOne: "Step 1 • Foundation",
    transliteration: "Transliteration:",
    timelineTitle: "Prayer Sequence Timeline (Steps 2 — 12)",
    timelineHint: "As you scroll down, the gold timeline line reveals each posture card when reached.",
    rakahTitle: "How many Rakahs?",
    rakahHint: "Tap a prayer to view its specific Rakah structure and Tashahhud positions.",
    rakahCount: (n: number) => `${n} Rakahs`,
    prayerHeading: (name: string, description: string) => `${name} Prayer (${description})`,
    close: "Close",
    scholarNote,
  },
  ml: {
    eyebrow: "നമസ്കാര മാർഗനിർദേശം",
    title: "നമസ്കാരം എങ്ങനെ നിർവഹിക്കാം",
    intro: "നമസ്കാരത്തിന്റെ ക്രമം ഓരോ ഘട്ടമായി പിന്തുടരാൻ താഴേക്ക് സ്ക്രോൾ ചെയ്യുക.",
    nextSection: "ദിക്ർ & ദുആ",
    stepOne: "ഘട്ടം 1 • അടിസ്ഥാനം",
    transliteration: "ഉച്ചാരണം:",
    timelineTitle: "നമസ്കാര ക്രമം (ഘട്ടങ്ങൾ 2 — 12)",
    timelineHint: "താഴേക്ക് സ്ക്രോൾ ചെയ്യുമ്പോൾ, സ്വർണ്ണ വര ഓരോ ഘട്ടത്തിലെത്തുമ്പോൾ അതിന്റെ കാർഡ് തെളിയും.",
    rakahTitle: "എത്ര റക്അത്ത്?",
    rakahHint: "ഓരോ നമസ്കാരത്തിന്റെയും റക്അത്ത് ഘടനയും തശഹ്ഹുദിന്റെ സ്ഥാനങ്ങളും കാണാൻ അതിൽ ടാപ്പ് ചെയ്യുക.",
    rakahCount: (n: number) => `${n} റക്അത്ത്`,
    prayerHeading: (name: string, description: string) => `${name} നമസ്കാരം (${description})`,
    close: "അടയ്ക്കുക",
    scholarNote: scholarNoteMl,
  },
});

/** The step cards come from the admin (Namaz guide); none published hides the section. */
export const NamazGuide: React.FC<{ steps: PrayerStep[] }> = ({ steps }) => {
  if (steps.length === 0) {
    return null;
  }

  return <NamazGuideContent steps={steps} />;
};

const NamazGuideContent: React.FC<{ steps: PrayerStep[] }> = ({ steps }) => {
  const t = useCopy(copy);
  const locale = useLocale();
  const [selectedRakah, setSelectedRakah] = useState<RakahInfo | null>(null);
  const rakahText = (rakah: RakahInfo) => (locale === "ml" ? rakah.ml : rakah);

  const [stepStatuses, setStepStatuses] = useState<Record<string, "hidden" | "active" | "done">>({});

  const timelineRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const skipProps = { sectionRef, endRef, nextSectionId: "dhikr", nextSectionLabel: t.nextSection };
  const prefersReducedMotion = usePrefersReducedMotion();

  // Niyyah (Step 1) is rendered separately at the top. Step text stays in the language the admin typed it in.
  const niyyahStep = steps[0];
  // Timeline steps are Steps 2 through 12
  const timelineSteps = useMemo(() => steps.slice(1), [steps]);
  const totalSteps = steps.length;

  // Scroll handler: calculates timeline fill height & step statuses outside JSX render
  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const viewportTriggerLine = window.innerHeight * 0.65;

      const currentFilledPx = viewportTriggerLine - rect.top;
      const clampedFilledPx = Math.max(0, Math.min(rect.height, currentFilledPx));
      // The gold line moves without a React render; only status changes re-render.
      if (fillRef.current) {
        fillRef.current.style.height = `${clampedFilledPx}px`;
      }

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

    // At most one measurement per frame, however fast the scroll events arrive.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        handleScroll();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    handleScroll();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [timelineSteps]);

  return (
    <section ref={sectionRef} id="namaz" className="py-14 sm:py-20 md:py-28 bg-bg font-body text-text-main overflow-hidden">
      <Container>
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
            {t.eyebrow}
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-primary tracking-tight mt-1">
            {t.title}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-muted">
            {t.intro}
          </p>
          <NamazSkip placement="inline" {...skipProps} />
        </div>

        {/* 1. NIYYAH (INTENTION) — Featured at Top (No Stickman Figure, No Timeline Scroll Animation) */}
        <div className="max-w-3xl mx-auto mb-10 sm:mb-16">
          <div className="bg-white rounded-[22px] p-5 sm:p-8 border border-secondary/40 shadow-floating relative overflow-hidden">
            {/* Top Accent Strip */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-secondary via-secondary-hover to-primary" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="bg-secondary text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {t.stepOne}
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
                <span className="font-bold text-primary">{t.transliteration}</span> {niyyahStep.transliteration}
              </p>
            </div>

            <StepGuidance step={niyyahStep} />
          </div>
        </div>

        {/* Divider & Subheading for Prayer Flow Timeline */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <span className="text-xs font-bold text-secondary uppercase tracking-widest">
            {t.timelineTitle}
          </span>
          <p className="text-xs text-text-muted mt-1">
            {t.timelineHint}
          </p>
        </div>

        {/* 2. CENTERED TIMELINE & CARDS (Steps 2 to 12) */}
        <div ref={timelineRef} className="max-w-3xl mx-auto relative pl-4 sm:pl-6">
          {/* Vertical Timeline Grey Line & Gold Fill Line */}
          <div className="absolute left-[13px] sm:left-[17px] top-4 bottom-4 w-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              ref={fillRef}
              className="w-full bg-secondary rounded-full transition-[height] duration-150 ease-out"
              style={prefersReducedMotion ? { height: "100%" } : undefined}
            />
          </div>

          {/* Timeline Cards Stack */}
          <div className="space-y-8 sm:space-y-16">
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
        <div ref={endRef} className="mt-12 sm:mt-20 max-w-3xl mx-auto p-5 sm:p-8 rounded-[22px] bg-primary-tint border border-primary/10 shadow-soft">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
            <div>
              <h3 className="font-display text-xl font-bold text-primary">
                {t.rakahTitle}
              </h3>
              <p className="text-xs text-text-muted mt-1">
                {t.rakahHint}
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-2.5">
              {rakahData.map((rakah) => (
                <button
                  key={rakah.name}
                  type="button"
                  onClick={() => setSelectedRakah(rakah)}
                  className="min-h-11 sm:min-h-0 px-4 py-2 rounded-full bg-white border border-primary/15 text-primary hover:border-secondary hover:bg-secondary-tint text-xs font-semibold shadow-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  <span className="font-bold">{rakahText(rakah).name}:</span> {t.rakahCount(rakah.rakahs)}
                </button>
              ))}
            </div>
          </div>

          {/* Rakah Details Panel */}
          {selectedRakah && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-5 rounded-xl bg-white border border-secondary/30 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-display text-base sm:text-lg font-bold text-primary">
                  {t.prayerHeading(rakahText(selectedRakah).name, rakahText(selectedRakah).description)}
                </span>
                <button
                  onClick={() => setSelectedRakah(null)}
                  className="-mr-2 -mt-1 shrink-0 inline-flex min-h-9 items-center rounded-full px-3 text-xs text-text-muted hover:text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  {t.close} ✕
                </button>
              </div>
              <p className="mt-2 text-sm text-text-main leading-relaxed">
                {rakahText(selectedRakah).details}
              </p>
            </m.div>
          )}
        </div>

        {/* Mandatory Scholar Audit Note */}
        <div className="mt-12 text-center text-xs text-text-muted italic border-t border-primary/10 pt-6 max-w-2xl mx-auto">
          <p>{t.scholarNote}</p>
        </div>
      </Container>
      <NamazSkip placement="floating" {...skipProps} />
    </section>
  );
};
