"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DhikrItem } from "@/data/dhikr";
import { defineCopy, hasMalayalamScript, useCopy } from "@/lib/i18n/locale";

const copy = defineCopy({
  en: {
    title: "Study Mode",
    reviewRound: "(Review round)",
    close: "Close study mode",
    complete: "Session Complete",
    studied: (n: number) => `You studied ${n} dhikr`,
    known: "Known",
    needReview: "Need review",
    studyAgain: "Study again",
    exit: "Exit",
    progress: (current: number, total: number) => `${current} of ${total}`,
    revealHint: "Tap or press Space to reveal meaning",
    sayTimes: (n: number) => `Say ${n} times`,
    showFront: "Show front",
    showBack: "Show back",
    reveal: "Reveal meaning",
    gotIt: "Got it ✓",
    reviewAgain: "Review again ↻",
    previous: "Previous card",
    next: "Next card",
    shuffleCards: "Shuffle cards",
    shuffle: "Shuffle",
  },
  ml: {
    title: "പഠന മോഡ്",
    reviewRound: "(പുനരവലോകനം)",
    close: "പഠന മോഡ് അടയ്ക്കുക",
    complete: "പഠനം പൂർത്തിയായി",
    studied: (n: number) => `നിങ്ങൾ ${n} ദിക്ർ പഠിച്ചു`,
    known: "അറിയാം",
    needReview: "വീണ്ടും പഠിക്കണം",
    studyAgain: "വീണ്ടും പഠിക്കുക",
    exit: "പുറത്തുകടക്കുക",
    progress: (current: number, total: number) => `${total}-ൽ ${current}`,
    revealHint: "അർത്ഥം കാണാൻ ടാപ്പ് ചെയ്യുക അല്ലെങ്കിൽ സ്പേസ് അമർത്തുക",
    sayTimes: (n: number) => `${n} തവണ ചൊല്ലുക`,
    showFront: "മുൻവശം കാണുക",
    showBack: "പിൻവശം കാണുക",
    reveal: "അർത്ഥം കാണുക",
    gotIt: "മനസ്സിലായി ✓",
    reviewAgain: "വീണ്ടും നോക്കാം ↻",
    previous: "മുമ്പത്തെ കാർഡ്",
    next: "അടുത്ത കാർഡ്",
    shuffleCards: "കാർഡുകൾ ഇടകലർത്തുക",
    shuffle: "ഇടകലർത്തുക",
  },
});

interface StudyModeProps {
  items: DhikrItem[];
  onClose: () => void;
}

type StudyStatus = "unseen" | "known" | "review";

interface FlashcardState {
  index: number;
  flipped: boolean;
  statuses: Map<string, StudyStatus>;
  queue: number[];
  reviewQueue: number[];
  phase: "study" | "review" | "summary";
  shuffled: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const StudyMode: React.FC<StudyModeProps> = ({ items, onClose }) => {
  const t = useCopy(copy);
  const [state, setState] = useState<FlashcardState>(() => ({
    index: 0,
    flipped: false,
    statuses: new Map(),
    queue: items.map((_, i) => i),
    reviewQueue: [],
    phase: "study",
    shuffled: false,
  }));

  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const reducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  // Focus trap and save/restore focus
  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement;
    containerRef.current?.focus();

    return () => {
      previousFocus.current?.focus();
    };
  }, []);

  const handleNext = useCallback(() => {
    setState((s) => {
      const q = s.phase === "review" ? s.reviewQueue : s.queue;
      if (s.index < q.length - 1) {
        return { ...s, index: s.index + 1, flipped: false };
      }
      return s;
    });
  }, []);

  const handlePrev = useCallback(() => {
    setState((s) => {
      if (s.index > 0) {
        return { ...s, index: s.index - 1, flipped: false };
      }
      return s;
    });
  }, []);

  // The page behind the sheet stays put while studying (touch scrolls would move it otherwise).
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Keyboard handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (state.phase === "summary") return;
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setState((s) => ({ ...s, flipped: !s.flipped }));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state.phase, onClose, handleNext, handlePrev]);

  const currentQueue =
    state.phase === "review" ? state.reviewQueue : state.queue;
  const currentItem = items[currentQueue[state.index]];
  // Dhikr text stays in the language the admin typed it in, whichever site language is chosen.
  const pronunciationIsMl = hasMalayalamScript(currentItem?.transliteration);
  const totalInQueue = currentQueue.length;

  const knownCount = useMemo(() => {
    let count = 0;
    state.statuses.forEach((v) => {
      if (v === "known") count++;
    });
    return count;
  }, [state.statuses]);

  const reviewCount = useMemo(() => {
    let count = 0;
    state.statuses.forEach((v) => {
      if (v === "review") count++;
    });
    return count;
  }, [state.statuses]);

  const handleShuffle = useCallback(() => {
    setState((s) => ({
      ...s,
      queue: shuffleArray(s.queue),
      index: 0,
      flipped: false,
      shuffled: true,
    }));
  }, []);

  const handleGotIt = useCallback(() => {
    if (!currentItem) return;
    setState((s) => {
      const newStatuses = new Map(s.statuses);
      newStatuses.set(currentItem.id, "known");
      const q = s.phase === "review" ? s.reviewQueue : s.queue;
      const isLast = s.index >= q.length - 1;

      if (isLast) {
        // Check if there are review items
        const reviewItems: number[] = [];
        newStatuses.forEach((v, k) => {
          if (v === "review") {
            const idx = items.findIndex((it) => it.id === k);
            if (idx >= 0) reviewItems.push(idx);
          }
        });

        if (s.phase === "study" && reviewItems.length > 0) {
          return {
            ...s,
            statuses: newStatuses,
            phase: "review",
            reviewQueue: reviewItems,
            index: 0,
            flipped: false,
          };
        }
        return { ...s, statuses: newStatuses, phase: "summary" };
      }

      return {
        ...s,
        statuses: newStatuses,
        index: s.index + 1,
        flipped: false,
      };
    });
  }, [currentItem, items]);

  const handleReviewAgain = useCallback(() => {
    if (!currentItem) return;
    setState((s) => {
      const newStatuses = new Map(s.statuses);
      newStatuses.set(currentItem.id, "review");
      const q = s.phase === "review" ? s.reviewQueue : s.queue;
      const isLast = s.index >= q.length - 1;

      if (isLast) {
        // Re-queue review items
        const reviewItems: number[] = [];
        newStatuses.forEach((v, k) => {
          if (v === "review") {
            const idx = items.findIndex((it) => it.id === k);
            if (idx >= 0) reviewItems.push(idx);
          }
        });

        if (reviewItems.length > 0) {
          return {
            ...s,
            statuses: newStatuses,
            phase: "review",
            reviewQueue: reviewItems,
            index: 0,
            flipped: false,
          };
        }
        return { ...s, statuses: newStatuses, phase: "summary" };
      }

      return {
        ...s,
        statuses: newStatuses,
        index: s.index + 1,
        flipped: false,
      };
    });
  }, [currentItem, items]);

  const handleStudyAgain = useCallback(() => {
    setState({
      index: 0,
      flipped: false,
      statuses: new Map(),
      queue: items.map((_, i) => i),
      reviewQueue: [],
      phase: "study",
      shuffled: false,
    });
  }, [items]);

  // Focus trap
  const handleFocusTrap = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;

      const focusable = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    []
  );

  const progressPercent =
    totalInQueue > 0 ? ((state.index + 1) / totalInQueue) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        onKeyDown={handleFocusTrap}
        className="relative w-full max-w-lg sm:mx-4 bg-white rounded-t-[var(--radius-card)] sm:rounded-[var(--radius-card)] shadow-2xl max-h-[92dvh] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)] animate-in fade-in focus:outline-none"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-border-subtle">
          <h3 className="font-display text-lg text-primary font-medium">
            {t.title}
            {state.phase === "review" && (
              <span className="ml-2 text-xs text-secondary font-body">
                {t.reviewRound}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full hover:bg-primary-tint transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {state.phase === "summary" ? (
          /* ─── Summary screen ─── */
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-tint flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--secondary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h4 className="font-display text-2xl text-primary mb-2">
              {t.complete}
            </h4>
            <p className="text-text-muted mb-6">
              {t.studied(items.length)}
            </p>

            <div className="flex justify-center gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {knownCount}
                </div>
                <div className="text-xs text-text-muted mt-1">{t.known}</div>
              </div>
              <div className="w-px bg-border-subtle" />
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">
                  {reviewCount}
                </div>
                <div className="text-xs text-text-muted mt-1">{t.needReview}</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleStudyAgain}
                className="px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t.studyAgain}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-primary-tint text-primary text-sm font-semibold hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t.exit}
              </button>
            </div>
          </div>
        ) : (
          /* ─── Flashcard screen ─── */
          <>
            {/* Progress bar */}
            <div className="px-4 sm:px-6 pt-4">
              <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                <span>
                  {t.progress(state.index + 1, totalInQueue)}
                </span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full h-1.5 bg-primary-tint rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Flashcard */}
            <div
              className="px-4 py-6 sm:px-6 sm:py-8"
              aria-live="polite"
              aria-atomic="true"
            >
              <div
                className="relative w-full min-h-[240px]"
                style={{ perspective: "1000px" }}
              >
                <div
                  className={`relative w-full transition-transform ${reducedMotion ? "" : "duration-500"}`}
                  style={{
                    transformStyle: reducedMotion ? undefined : "preserve-3d",
                    transform: state.flipped
                      ? reducedMotion
                        ? undefined
                        : "rotateY(180deg)"
                      : "rotateY(0deg)",
                  }}
                >
                  {/* Front */}
                  <div
                    className={`w-full ${state.flipped && reducedMotion ? "hidden" : ""}`}
                    style={
                      reducedMotion
                        ? {}
                        : {
                            backfaceVisibility: "hidden",
                          }
                    }
                  >
                    <div className="bg-primary-tint rounded-2xl p-6 text-center">
                      <p
                        className="font-arabic text-3xl sm:text-4xl leading-[2] text-primary mb-4"
                        dir="rtl"
                        lang="ar"
                      >
                        {currentItem?.arabic}
                      </p>
                      {pronunciationIsMl ? (
                        <p className="font-malayalam text-base text-secondary font-medium" lang="ml">
                          {currentItem?.transliteration}
                        </p>
                      ) : (
                        <p className="text-base text-secondary italic font-medium">
                          {currentItem?.transliteration}
                        </p>
                      )}
                      <p className="text-xs text-text-muted mt-4">
                        {t.revealHint}
                      </p>
                    </div>
                  </div>

                  {/* Back */}
                  <div
                    className={`w-full ${!state.flipped && reducedMotion ? "hidden" : ""}`}
                    style={
                      reducedMotion
                        ? {}
                        : {
                            backfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                            position: "absolute",
                            top: 0,
                            left: 0,
                          }
                    }
                  >
                    <div className="bg-secondary-tint rounded-2xl p-6 text-center">
                      <p
                        className="font-malayalam text-lg text-primary leading-relaxed mb-4"
                        lang="ml"
                      >
                        {currentItem?.malayalam}
                      </p>
                      <p className="text-xs text-text-muted">
                        {currentItem?.source}
                      </p>
                      {currentItem?.repeat && currentItem.repeat > 1 && (
                        <p className="text-sm text-secondary font-semibold mt-2">
                          {t.sayTimes(currentItem.repeat)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Flip button (mobile) */}
              <button
                onClick={() =>
                  setState((s) => ({ ...s, flipped: !s.flipped }))
                }
                className="mt-4 w-full py-2.5 rounded-full bg-primary-tint text-primary text-sm font-medium hover:bg-primary/10 transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:hidden"
                aria-label={state.flipped ? t.showFront : t.showBack}
              >
                {state.flipped ? t.showFront : t.reveal}
              </button>
            </div>

            {/* Controls */}
            <div className="px-4 pb-5 sm:px-6 sm:pb-6 space-y-3">
              {/* Got it / Review again */}
              {state.flipped && (
                <div className="flex gap-3">
                  <button
                    onClick={handleGotIt}
                    className="flex-1 min-h-11 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {t.gotIt}
                  </button>
                  <button
                    onClick={handleReviewAgain}
                    className="flex-1 min-h-11 py-2.5 rounded-full bg-secondary-tint text-secondary text-sm font-semibold hover:bg-secondary/20 transition-colors
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  >
                    {t.reviewAgain}
                  </button>
                </div>
              )}

              {/* Nav + Shuffle */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={state.index === 0}
                  aria-label={t.previous}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-tint text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <button
                  onClick={handleShuffle}
                  aria-label={t.shuffleCards}
                  className="px-4 py-2 rounded-full bg-primary-tint text-primary text-xs font-medium hover:bg-primary/10 transition-colors
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="flex items-center gap-1.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="16 3 21 3 21 8" />
                      <line x1="4" y1="20" x2="21" y2="3" />
                      <polyline points="21 16 21 21 16 21" />
                      <line x1="15" y1="15" x2="21" y2="21" />
                      <line x1="4" y1="4" x2="9" y2="9" />
                    </svg>
                    {t.shuffle}
                  </span>
                </button>

                <button
                  onClick={handleNext}
                  disabled={state.index >= totalInQueue - 1}
                  aria-label={t.next}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-tint text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
