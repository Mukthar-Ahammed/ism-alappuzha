"use client";

import React from "react";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import type { Program } from "@/data/programs";
import { ProgramList } from "./ProgramList";
import {
  getISTParts,
  getTimeRangeFormatted,
  getCountdownLabel,
  isProgramActiveNow,
  downloadIcsFile,
} from "@/lib/utils/dateUtils";
import { defineCopy, pickText, useCopy, useLocale } from "@/lib/i18n/locale";

type DateParts = ReturnType<typeof getISTParts>;

const copy = defineCopy({
  en: {
    formats: {
      in_person: "In person",
      online: "Online live stream",
      hybrid: "In person & online",
    } as Record<NonNullable<Program["format"]>, string>,
    fullDate: (p: DateParts) => `${p.weekdayLong}, ${p.day} ${p.monthShort} ${p.year}`,
    live: "LIVE",
    speaker: "Speaker",
    openPoster: (title: string) => `Open the poster for ${title}`,
    posterAlt: (title: string) => `Poster for ${title}`,
    viewPoster: "View poster",
    watchLive: "Watch live",
    watchLatest: "Watch latest video",
    programLink: "Program link",
    addToCalendar: "Add to calendar",
    prevProgram: "Previous program",
    nextProgram: "Next program",
    prev: "Previous",
    next: "Next",
    programWord: " program",
    noPrograms: "No programs scheduled yet.",
    noProgramsHint: "Watch the latest video while you wait for new announcements.",
  },
  ml: {
    formats: {
      in_person: "നേരിട്ട്",
      online: "ഓൺലൈൻ തത്സമയം",
      hybrid: "നേരിട്ടും ഓൺലൈനായും",
    },
    fullDate: (p: DateParts) => `${p.year} ${p.monthShort} ${p.day}, ${p.weekdayLong}`,
    live: "തത്സമയം",
    speaker: "പ്രഭാഷകൻ",
    openPoster: (title: string) => `${title} — പോസ്റ്റർ തുറക്കുക`,
    posterAlt: (title: string) => `${title} — പോസ്റ്റർ`,
    viewPoster: "പോസ്റ്റർ കാണുക",
    watchLive: "തത്സമയം കാണുക",
    watchLatest: "പുതിയ വീഡിയോ കാണുക",
    programLink: "പരിപാടിയുടെ ലിങ്ക്",
    addToCalendar: "കലണ്ടറിൽ ചേർക്കുക",
    prevProgram: "മുൻ പരിപാടി",
    nextProgram: "അടുത്ത പരിപാടി",
    prev: "മുമ്പത്തേത്",
    next: "അടുത്തത്",
    programWord: "",
    noPrograms: "പരിപാടികൾ ഒന്നും നിശ്ചയിച്ചിട്ടില്ല.",
    noProgramsHint: "പുതിയ അറിയിപ്പുകൾ വരുന്നതുവരെ ഏറ്റവും പുതിയ വീഡിയോ കാണുക.",
  },
});

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
  const locale = useLocale();
  const t = useCopy(copy);
  // Malayalam labels are long enough to wrap onto two lines when paired, so stack them on mobile.
  const stackActions = locale === "ml";
  const isLive = program ? isProgramActiveNow(program) : false;
  const countdownLabel = program ? getCountdownLabel(program, new Date(), locale) : "";

  const text = (en: string, ml: string | undefined) => pickText(locale, en, ml).replace(/^TODO:\s*/, "");
  const cleanTitle = program ? text(program.title, program.titleMl) : "";
  const cleanSpeaker = program ? text(program.speaker, program.speakerMl) : "";
  const cleanVenue = program ? text(program.venue, program.venueMl) : "";
  const cleanDesc = program ? text(program.description, program.descriptionMl) : "";

  const istParts = program ? getISTParts(program.date, locale) : null;
  const timeRangeStr = program
    ? getTimeRangeFormatted(program.date, program.endTime, locale)
    : "";
  const fullDateLabel = istParts
    ? t.fullDate(istParts)
    : "";

  return (
    <div aria-live="polite" className="w-full h-full sm:min-h-[380px] flex flex-col justify-between">
      <AnimatePresence mode="wait">
        {program ? (
          <m.div
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
              {/* Phones and tablets: the poster is a banner above the text, so the title gets
                  the full width (wide screens show it as its own column in NextProgramCard). */}
              {program.poster && (
                <a
                  href={program.poster.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.openPoster(cleanTitle)}
                  className="group relative mx-auto mb-5 block w-fit rounded-2xl transition-transform duration-300 ease-out hover:-translate-y-1 active:scale-[0.98] lg:hidden motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                >
                  <Image
                    src={program.poster.url}
                    alt={program.poster.alt || t.posterAlt(cleanTitle)}
                    width={program.poster.width}
                    height={program.poster.height}
                    sizes="(max-width: 640px) 70vw, 288px"
                    placeholder="blur"
                    blurDataURL={program.poster.blurDataUrl}
                    className="h-64 w-auto max-w-full rounded-2xl object-contain shadow-soft transition-shadow duration-300 group-hover:shadow-floating sm:h-80"
                  />
                  <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[0.6875rem] font-semibold text-white opacity-90 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                    <svg className="h-3 w-3 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
                    </svg>
                    {t.viewPoster}
                  </span>
                </a>
              )}

              <div>
                <div className="min-w-0">
                  {/* Status badges */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[0.6875rem] sm:text-xs font-bold bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                        </span>
                        {t.live}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[0.6875rem] sm:text-xs font-semibold bg-secondary-tint text-primary border border-secondary/20">
                        <svg
                          className="w-3.5 h-3.5 stroke-secondary stroke-2 fill-none shrink-0"
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
                    {program.format && (
                      <span className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-[0.6875rem] sm:text-xs font-semibold bg-primary-tint text-primary border border-primary/10">
                        {t.formats[program.format]}
                      </span>
                    )}
                  </div>

                  {/* Program Title (Fraunces serif display) */}
                  <h3 className="mt-3 font-display text-[1.75rem] sm:text-3xl font-bold text-primary leading-[1.1] break-words">
                    {cleanTitle}
                  </h3>

                  {/* Speaker */}
                  {cleanSpeaker && (
                  <div className="mt-3 flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-tint">
                      <svg
                        className="w-4 h-4 stroke-secondary stroke-2 fill-none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block text-[0.6875rem] font-semibold uppercase tracking-wider text-text-muted">
                        {t.speaker}
                      </span>
                      <span className="block truncate text-sm font-semibold text-primary">
                        {cleanSpeaker}
                      </span>
                    </span>
                  </div>
                  )}
                </div>
              </div>

              {/* Description: full width so it reads comfortably */}
              {cleanDesc && (
                <p className="mt-4 text-[0.9375rem] sm:text-sm text-text-muted line-clamp-4 sm:line-clamp-3 leading-relaxed break-words">
                  {cleanDesc}
                </p>
              )}

              {/* Date, Time, Venue Details */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 sm:gap-2.5 divide-y divide-border-subtle/50 sm:divide-y-0 rounded-2xl bg-primary-tint/60 px-3.5 py-1 text-sm text-text-main sm:rounded-none sm:bg-transparent sm:p-0">
                <div className="flex items-center gap-3 py-2.5 sm:gap-2 sm:py-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-tint sm:h-auto sm:w-auto sm:bg-transparent">
                    <svg
                      className="w-4 h-4 stroke-secondary stroke-2 fill-none"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </span>
                  <span className="font-medium sm:font-normal">{fullDateLabel}</span>
                </div>
                <div className="flex items-center gap-3 py-2.5 sm:gap-2 sm:py-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-tint sm:h-auto sm:w-auto sm:bg-transparent">
                    <svg
                      className="w-4 h-4 stroke-secondary stroke-2 fill-none"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </span>
                  <span className="font-medium sm:font-normal">{timeRangeStr}</span>
                </div>
                <div className="sm:col-span-2 flex items-center gap-3 py-2.5 sm:items-start sm:gap-2 sm:py-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-tint sm:mt-0.5 sm:h-auto sm:w-auto sm:bg-transparent">
                    <svg
                      className="w-4 h-4 stroke-secondary stroke-2 fill-none"
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
                  </span>
                  <span className="font-medium sm:font-normal line-clamp-2 sm:line-clamp-1">{cleanVenue}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="mt-5 pt-4 border-t border-border-subtle/40 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                {isLive ? (
                  <a
                    href="#live"
                    className="col-span-2 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white justify-center px-5 py-3 sm:py-2.5 rounded-full text-sm sm:text-xs font-semibold shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <span>{t.watchLive}</span>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </a>
                ) : (
                  <a
                    href="#videos"
                    className="col-span-2 inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white justify-center px-5 py-3 sm:py-2.5 rounded-full text-sm sm:text-xs font-semibold shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  >
                    <span>{t.watchLatest}</span>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </a>
                )}

                {program.link && (
                  <a
                    href={program.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${stackActions ? "col-span-2 " : ""}inline-flex items-center gap-2 bg-white hover:bg-primary-tint text-primary border border-border-subtle justify-center px-3 sm:px-5 py-3 sm:py-2.5 rounded-full text-sm sm:text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary`}
                  >
                    <span>{t.programLink}</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => downloadIcsFile(program)}
                  className={`${program.link && !stackActions ? "" : "col-span-2 "}inline-flex items-center gap-2 bg-secondary-tint hover:bg-secondary/20 text-primary border border-secondary/30 justify-center px-3 sm:px-5 py-3 sm:py-2.5 rounded-full text-sm sm:text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary`}
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
                  <span>{t.addToCalendar}</span>
                </button>
              </div>

              {/* Prev / Next Program Arrow Buttons */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5 sm:ml-auto">
                <button
                  type="button"
                  onClick={onPrevProgram}
                  disabled={!hasPrevProgram}
                  aria-label={t.prevProgram}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2.5 sm:py-1.5 rounded-full sm:rounded-lg border border-border-subtle/60 text-sm sm:text-xs font-semibold text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-tint transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
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
                  <span>{t.prev}<span className="hidden sm:inline">{t.programWord}</span></span>
                </button>
                <button
                  type="button"
                  onClick={onNextProgram}
                  disabled={!hasNextProgram}
                  aria-label={t.nextProgram}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2.5 sm:py-1.5 rounded-full sm:rounded-lg border border-border-subtle/60 text-sm sm:text-xs font-semibold text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-tint transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  <span>{t.next}<span className="hidden sm:inline">{t.programWord}</span></span>
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
          </m.div>
        ) : (
          /* Empty state: No upcoming programs */
          <m.div
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
              {t.noPrograms}
            </p>
            <p className="mt-1 text-xs sm:text-sm text-text-muted max-w-xs mb-6">
              {t.noProgramsHint}
            </p>
            <a
              href="#videos"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full text-xs font-semibold shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <span>{t.watchLatest}</span>
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </a>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};
