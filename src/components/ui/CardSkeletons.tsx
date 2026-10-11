import React from "react";
import { cn } from "@/lib/utils/cn";

// Skeletons shaped like the public cards they stand in for, using the shared gold
// `skeleton` sweep from globals.css. Hidden from screen readers; the caller announces
// the loading state once.

const Bar: React.FC<{ className?: string }> = ({ className }) => (
  <div aria-hidden="true" className={cn("skeleton rounded-md", className)} />
);

/** Matches DhikrCard: category pill, right-aligned Arabic, transliteration, meaning, actions. */
export const DhikrCardSkeleton: React.FC = () => (
  <div
    aria-hidden="true"
    className="flex flex-col bg-white border border-border-subtle rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)]"
  >
    <Bar className="h-6 w-28 rounded-full" />
    <div className="mt-6 flex flex-col items-end gap-3">
      <Bar className="h-7 w-11/12" />
      <Bar className="h-7 w-2/3" />
    </div>
    <Bar className="mt-5 h-4 w-4/5" />
    <Bar className="mt-3 h-3.5 w-full" />
    <Bar className="mt-2 h-3.5 w-3/4" />
    <Bar className="mt-5 h-3 w-1/3" />
    <div className="mt-6 flex gap-2 border-t border-border-subtle pt-4">
      <Bar className="h-9 w-20 rounded-full" />
      <Bar className="h-9 w-16 rounded-full" />
      <Bar className="ml-auto h-9 w-9 rounded-full" />
    </div>
  </div>
);

/** Matches a closed question in the public Q&A list: category pill and the question. */
export const QaCardSkeleton: React.FC<{ wide?: boolean }> = ({ wide = false }) => (
  <div
    aria-hidden="true"
    className="flex items-start justify-between gap-4 bg-white rounded-[var(--radius-card)] p-6 border border-border-subtle"
  >
    <div className="flex-1 space-y-3">
      <Bar className="h-5 w-24 rounded-full" />
      <Bar className={cn("h-5", wide ? "w-11/12" : "w-3/4")} />
      {wide && <Bar className="h-5 w-1/2" />}
    </div>
    <Bar className="h-8 w-8 shrink-0 rounded-full" />
  </div>
);
