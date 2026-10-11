"use client";

import React, { useState } from "react";
import type { PrayerStep } from "@/data/namaz";
import { cn } from "@/lib/utils/cn";
import { defineCopy, useCopy } from "@/lib/i18n/locale";

const copy = defineCopy({
  en: {
    stepOf: (step: number, total: number) => `Step ${step} of ${total}`,
    repeat: "Repeat Cycle",
    transliteration: "Transliteration:",
    showTips: "Show meaning and tips",
    hideTips: "Hide meaning and tips",
    malayalam: "മലയാളം രൂപം:",
    dos: "Recommended (Do):",
    donts: "Avoid (Don't):",
  },
  ml: {
    stepOf: (step: number, total: number) => `ഘട്ടം ${step} / ${total}`,
    repeat: "ആവർത്തിക്കുക",
    transliteration: "ഉച്ചാരണം:",
    showTips: "അർത്ഥവും നിർദേശങ്ങളും കാണുക",
    hideTips: "അർത്ഥവും നിർദേശങ്ങളും മറയ്ക്കുക",
    malayalam: "മലയാളം രൂപം:",
    dos: "ചെയ്യേണ്ടവ:",
    donts: "ഒഴിവാക്കേണ്ടവ:",
  },
});

export interface TimelineStepProps {
  step: PrayerStep;
  status: "hidden" | "active" | "done";
  totalSteps: number;
}

export const TimelineStep: React.FC<TimelineStepProps> = ({
  step,
  status,
  totalSteps,
}) => {
  const t = useCopy(copy);
  const isActive = status === "active";
  const isDone = status === "done";
  const isHidden = status === "hidden";

  return (
    <div
      id={`namaz-step-${step.id}`}
      className={cn(
        "relative flex items-start gap-3 sm:gap-6 font-body transition-all duration-500 ease-out",
        isActive && "opacity-100 translate-y-0 scale-[1.01]",
        isDone && "opacity-85 translate-y-0",
        isHidden && "opacity-15 translate-y-6 pointer-events-none"
      )}
    >
      {/* Node Icon Circle on Vertical Line */}
      <div className="relative z-10 flex items-center justify-center shrink-0 mt-1">
        <div
          className={cn(
            "w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-xs",
            isActive && "bg-secondary text-primary scale-125 ring-4 ring-secondary/20 shadow-floating",
            isDone && "bg-primary text-white",
            isHidden && "bg-white border-2 border-gray-300 text-text-muted"
          )}
        >
          {isDone ? (
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          ) : (
            <span>{step.stepNumber}</span>
          )}
        </div>
      </div>

      {/* Step Card Content */}
      <div
        className={cn(
          "flex-1 min-w-0 bg-white rounded-[22px] p-4 sm:p-8 border transition-all duration-300",
          isActive
            ? "border-secondary/50 shadow-floating ring-1 ring-secondary/30"
            : "border-primary/10 shadow-soft"
        )}
      >
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
              {t.stepOf(step.stepNumber, totalSteps)}
            </span>
            {step.isRepeatNode && (
              <span className="bg-secondary-tint text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                {t.repeat}
              </span>
            )}
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-primary">
            {step.name}
          </h3>
        </div>

        {/* What to Do (One-line) */}
        <p className="mt-4 text-sm sm:text-base text-text-main font-medium leading-relaxed">
          {step.whatToDo}
        </p>

        {/* Large Arabic Text (RTL) */}
        <div className="mt-5 p-4 rounded-xl bg-primary-tint border border-primary/10 text-right">
          <p className="font-arabic text-2xl sm:text-3xl text-primary leading-loose dir-rtl">
            {step.arabic}
          </p>
          <p className="mt-2 text-xs sm:text-sm text-secondary font-medium font-body text-left">
            <span className="font-bold text-primary">{t.transliteration}</span> {step.transliteration}
          </p>
        </div>

        <StepGuidance step={step} />
      </div>
    </div>
  );
};

/**
 * The Malayalam meaning and the do/don't lists. Always shown from the sm breakpoint up;
 * on phones they sit behind a toggle so the 12-step guide is not several screens per step.
 */
export const StepGuidance: React.FC<{ step: PrayerStep }> = ({ step }) => {
  const t = useCopy(copy);
  const [open, setOpen] = useState(false);
  const panelId = `namaz-guidance-${step.id}`;

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="sm:hidden mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary/15 px-4 text-xs font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      >
        {open ? t.hideTips : t.showTips}
        <svg
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div id={panelId} className={cn(open ? "block" : "hidden", "sm:block")}>
        {/* Malayalam Explanation Placeholder */}
        <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-text-muted font-malayalam">
          <span className="font-bold text-primary block mb-1">{t.malayalam}</span>
          <p>{step.malayalam}</p>
        </div>

        {/* Do and Don't Lists */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-primary/10">
          <div className="space-y-1.5">
            <span className="font-bold text-primary flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <span className="text-emerald-600 font-extrabold">✓</span> {t.dos}
            </span>
            <ul className="space-y-1 text-text-muted pl-4 list-disc">
              {step.dos.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <span className="font-bold text-primary flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <span className="text-red-500 font-extrabold">✕</span> {t.donts}
            </span>
            <ul className="space-y-1 text-text-muted pl-4 list-disc">
              {step.donts.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};
