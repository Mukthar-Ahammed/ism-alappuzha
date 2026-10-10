"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Program } from "@/data/programs";
import { ProgramList } from "./ProgramList";
import {
  getISTParts,
  getTimeRangeFormatted,
  getCountdownLabel,
  isProgramActiveNow,
  downloadIcsFile,
} from "@/lib/utils/dateUtils";

interface ProgramDetailsProps {
  program: Program | null;
  dayPrograms: Program[];
  selectedProgramId: string;
  onSelectProgram: (program: Program) => void;
  hasPrevProgram: boolean;
  hasNextProgram: boolean;
  onPrevProgram: () => void;
  onNextProgram: () => void;
  prefersReducedMotion?: boolean;
}

export const ProgramDetails: React.FC<ProgramDetailsProps> = ({
  program,
  dayPrograms,
  selectedProgramId,
  onSelectProgram,
  hasPrevProgram,
  hasNextProgram,
  onPrevProgram,
  onNextProgram,
  prefersReducedMotion = false,
}) => {
  const isLive = program ? isProgramActiveNow(program) : false;
  const countdownLabel = program ? getCountdownLabel(program) : "";

  const cleanTitle = program ? program.title.replace(/^TODO:\s*/, "") : "";
  const cleanSpeaker = program ? program.speaker.replace(/^TODO:\s*/, "") : "";
  const cleanVenue = program ? program.venue.replace(/^TODO:\s*/, "") : "";
  const cleanDesc = program ? program.description.replace(/^TODO:\s*/, "") : "";

  const istParts = program ? getISTParts(program.date) : null;
  const timeRangeStr = program
    ? getTimeRangeFormatted(program.date, program.endTime)
    : "";
  const fullDateLabel = istParts
    ? `${istParts.weekdayLong}, ${istParts.day} ${istParts.monthShort} ${istParts.year}`
    : "";

  return (
    <div aria-live="polite" className="w-full h-full min-h-[380px] flex flex-col justify-between">
      <AnimatePresence mode="wait">
        {program ? (
          <motion.div
            key={program.id}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="flex-1 flex flex-col justify-between"
          >
            <div>
              {/* Multi-program switcher if >1 program on selected day */}
              <ProgramList
                programs={dayPrograms}
                selectedProgramId={selectedProgramId}
                onSelectProgram={onSelectProgram}
              />

              {/* Status Header Badge */}
              <div className="flex items-center gap-2 mb-3">
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                    </span>
                    LIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-secondary-tint text-primary border border-secondary/20">
                    <svg
                      className="w-3.5 h-3.5 stroke-secondary stroke-2 fill-none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{countdownLabel}</span>
                  </span>
                )}
              </div>

              {/* Program Title (Fraunces serif display) */}
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary leading-tight">
                {cleanTitle}
              </h3>

              {/* Speaker */}
              <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm font-medium text-text-muted">
                <svg
                  className="w-4 h-4 stroke-secondary stroke-2 fill-none shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Speaker: {cleanSpeaker}</span>
              </div>

              {/* Date, Time, Venue Details Grid */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-text-main">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 stroke-secondary stroke-2 fill-none shrink-0"
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{fullDateLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 stroke-secondary stroke-2 fill-none shrink-0"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{timeRangeStr}</span>
                </div>
                <div className="sm:col-span-2 flex items-start gap-2">
                  <svg
                    className="w-4 h-4 stroke-secondary stroke-2 fill-none shrink-0 mt-0.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="line-clamp-1">{cleanVenue}</span>
                </div>
              </div>

              {/* Description (max 2 lines) */}
              <p className="mt-3 text-xs sm:text-sm text-text-muted line-clamp-2 leading-relaxed">
                {cleanDesc}
              </p>
            </div>

            {/* Bottom Actions Row */}
            <div className="mt-6 pt-4 border-t border-border-subtle/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {isLive ? (
                  <a
                    href="#live"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <span>Watch live</span>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </a>
                ) : (
                  <a
                    href="#videos"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  >
                    <span>Watch latest video</span>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => downloadIcsFile(program)}
                  className="inline-flex items-center gap-2 bg-secondary-tint hover:bg-secondary/20 text-primary border border-secondary/30 px-5 py-2.5 rounded-full text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  <svg
                    className="w-3.5 h-3.5 stroke-current stroke-2 fill-none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 12v6m-3-3l3 3 3-3"
                    />
                  </svg>
                  <span>Add to calendar</span>
                </button>
              </div>

              {/* Prev / Next Program Arrow Buttons */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={onPrevProgram}
                  disabled={!hasPrevProgram}
                  aria-label="Previous program"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-subtle/60 text-xs font-semibold text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-tint transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  <svg
                    className="w-3.5 h-3.5 fill-none stroke-current stroke-2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span className="hidden sm:inline">Previous program</span>
                </button>
                <button
                  type="button"
                  onClick={onNextProgram}
                  disabled={!hasNextProgram}
                  aria-label="Next program"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border-subtle/60 text-xs font-semibold text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-tint transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  <span className="hidden sm:inline">Next program</span>
                  <svg
                    className="w-3.5 h-3.5 fill-none stroke-current stroke-2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Empty state: No upcoming programs */
          <motion.div
            key="empty"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center py-10 px-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary-tint flex items-center justify-center text-secondary mb-4">
              <svg
                className="w-6 h-6 stroke-secondary stroke-2 fill-none"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="font-display text-lg font-bold text-primary max-w-sm">
              No programs scheduled yet.
            </p>
            <p className="mt-1 text-xs sm:text-sm text-text-muted max-w-xs mb-6">
              Watch the latest video while you wait for new announcements.
            </p>
            <a
              href="#videos"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full text-xs font-semibold shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <span>Watch latest video</span>
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
