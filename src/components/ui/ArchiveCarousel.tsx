"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Issue } from "@/data/issues";

interface ArchiveCarouselProps {
  issues: Issue[];
  onRead: (issue: Issue) => void;
}

const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const BookmarkIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

export const ArchiveCarousel: React.FC<ArchiveCarouselProps> = ({ issues, onRead }) => {
  const [active, setActive] = useState(0);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  /* scroll active card to center */
  const scrollToActive = useCallback((idx: number) => {
    const track = trackRef.current;
    const card = cardRefs.current[idx];
    if (!track || !card) return;
    const offset = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    track.scrollTo({ left: offset, behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToActive(active); }, [active, scrollToActive]);

  const prev = useCallback(() => setActive((a) => Math.max(0, a - 1)), []);
  const next = useCallback(() => setActive((a) => Math.min(issues.length - 1, a + 1)), [issues.length]);

  const toggleBookmark = (id: string) =>
    setBookmarked((s) => {
      const n = new Set(s);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });

  /* keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next]);

  return (
    <div className="mt-16 pt-12 border-t border-primary/10">
      {/* Sub-heading row */}
      <div className="flex items-center justify-between mb-10 px-1">
        <div>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary">
            Past Issues Archive
          </h3>
          <p className="text-xs text-text-muted mt-1">{issues.length} editions available</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={active === 0}
            aria-label="Previous issue"
            className="w-9 h-9 rounded-full border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:border-primary disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={next}
            disabled={active === issues.length - 1}
            aria-label="Next issue"
            className="w-9 h-9 rounded-full border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white hover:border-primary disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Scrollable track */}
      <div
        ref={trackRef}
        className="flex gap-5 overflow-x-auto pb-6"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        aria-label="Past issues archive"
      >
        {issues.map((issue, idx) => {
          const isActive = idx === active;

          return (
            <div
              key={issue.id}
              ref={(el) => { cardRefs.current[idx] = el; }}
              onClick={() => setActive(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") setActive(idx); }}
              aria-label={`${issue.title}, ${issue.month} ${issue.year}`}
              style={{
                minWidth: "clamp(170px, 20vw, 230px)",
                flex: "0 0 auto",
                transform: isActive ? "scale(1.08)" : "scale(1)",
                transition: "transform 0.4s cubic-bezier(.4,0,.2,1), box-shadow 0.4s",
                cursor: isActive ? "default" : "pointer",
              }}
            >
              {/* Cover image — fills card */}
              <div
                className="relative w-full rounded-[14px] overflow-hidden shadow-floating"
                style={{ aspectRatio: "2/3" }}
              >
                {issue.coverImage ? (
                  <Image
                    src={issue.coverImage}
                    alt={`${issue.title} cover`}
                    fill
                    sizes="(max-width: 640px) 180px, 220px"
                    className="object-contain"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center">
                    <span className="font-display text-3xl font-black text-white/20">
                      {issue.month.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Persistent bottom action bar — always visible */}
                <div
                  className={[
                    "absolute bottom-0 inset-x-0 p-2.5 flex flex-col gap-2 transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-t from-primary via-primary/90 to-transparent pt-8"
                      : "bg-gradient-to-t from-primary/70 to-transparent pt-6",
                  ].join(" ")}
                >
                  {/* Read Online — always shown */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRead(issue); }}
                    className="w-full py-1.5 px-3 rounded-lg bg-secondary text-primary text-[11px] font-bold hover:bg-secondary-hover transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                    Read Online
                  </button>

                  {/* Download + Bookmark — shown on active */}
                  {isActive && (
                    <div className="flex gap-1.5">
                      <a
                        href={issue.pdfUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-semibold transition-colors flex items-center justify-center gap-1"
                        aria-label="Download PDF"
                      >
                        <DownloadIcon />
                        PDF
                      </a>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(issue.id); }}
                        aria-label={bookmarked.has(issue.id) ? "Remove bookmark" : "Bookmark"}
                        className={[
                          "py-1.5 px-2.5 rounded-lg text-[10px] font-semibold transition-colors flex items-center justify-center",
                          bookmarked.has(issue.id)
                            ? "bg-secondary text-primary"
                            : "bg-white/20 hover:bg-white/30 text-white",
                        ].join(" ")}
                      >
                        <BookmarkIcon filled={bookmarked.has(issue.id)} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Label below the card */}
              <div className="mt-3 pl-1 text-center">
                <p className="text-[11px] font-bold text-secondary uppercase tracking-wide">
                  {issue.month} {issue.year}
                </p>
                <p className="text-[12px] font-semibold text-primary leading-snug mt-0.5 line-clamp-1">
                  {issue.title.replace(/^TODO:\s*/i, "")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-2" role="tablist" aria-label="Issue navigation">
        {issues.map((issue, idx) => (
          <button
            key={issue.id}
            role="tab"
            aria-selected={idx === active}
            aria-label={`${issue.month} ${issue.year}`}
            onClick={() => setActive(idx)}
            className={[
              "rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
              idx === active
                ? "w-6 h-2.5 bg-primary"
                : "w-2.5 h-2.5 bg-primary/20 hover:bg-primary/40",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
};
