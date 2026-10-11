"use client";

import React, { useEffect, useMemo, useRef } from "react";
import type { Program } from "@/data/programs";
import { getISTParts } from "@/lib/utils/dateUtils";
import { defineCopy, useCopy, useLocale, type Locale } from "@/lib/i18n/locale";

const intlLocale: Record<Locale, string> = { en: "en-US", ml: "ml-IN" };

const copy = defineCopy({
  en: {
    prevMonth: "Previous month",
    nextMonth: "Next month",
    calendarFor: (month: string) => `Program Calendar for ${month}`,
    daysIn: (month: string) => `Days in ${month}`,
    programs: (n: number) => (n > 0 ? `${n} program${n > 1 ? "s" : ""}` : "no programs"),
    noneThisMonth: "No programs this month.",
    programDays: (n: number) =>
      `${n} program day${n > 1 ? "s" : ""} this month. Swipe and tap a highlighted date.`,
  },
  ml: {
    prevMonth: "മുൻ മാസം",
    nextMonth: "അടുത്ത മാസം",
    calendarFor: (month: string) => `${month} — പരിപാടി കലണ്ടർ`,
    daysIn: (month: string) => `${month} — ദിവസങ്ങൾ`,
    programs: (n: number) => (n > 0 ? `${n} പരിപാടി` : "പരിപാടികളില്ല"),
    noneThisMonth: "ഈ മാസം പരിപാടികളില്ല.",
    programDays: (n: number) =>
      `ഈ മാസം ${n} ദിവസം പരിപാടികളുണ്ട്. സ്വൈപ്പ് ചെയ്ത് അടയാളപ്പെടുത്തിയ തീയതി തിരഞ്ഞെടുക്കുക.`,
  },
});

interface ProgramCalendarProps {
  currentYear: number;
  currentMonth: number; // 0-indexed (0 = Jan, 11 = Dec)
  selectedDateKey: string; // "YYYY-MM-DD"
  programsByDate: Map<string, Program[]>;
  weekStartsOn?: "Sunday" | "Monday";
  onMonthChange: (year: number, month: number) => void;
  onDateSelect: (dateKey: string, programs: Program[]) => void;
  todayDateKey: string;
}

export const ProgramCalendar: React.FC<ProgramCalendarProps> = ({
  currentYear,
  currentMonth,
  selectedDateKey,
  programsByDate,
  weekStartsOn = "Sunday",
  onMonthChange,
  onDateSelect,
  todayDateKey,
}) => {
  const locale = useLocale();
  const t = useCopy(copy);

  const monthDate = useMemo(() => {
    return new Date(currentYear, currentMonth, 1);
  }, [currentYear, currentMonth]);

  const monthLong = useMemo(() => {
    return monthDate.toLocaleDateString(intlLocale[locale], { month: "long" });
  }, [monthDate, locale]);

  const dayNames = useMemo(() => {
    // 7 Jan 2024 was a Sunday.
    const start = weekStartsOn === "Monday" ? 8 : 7;
    return Array.from({ length: 7 }, (_, i) =>
      new Date(2024, 0, start + i).toLocaleDateString(intlLocale[locale], { weekday: "short" })
    );
  }, [weekStartsOn, locale]);

  // Compute grid days
  const gridCells = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1);
    
    // Day of week for 1st of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
    const rawFirstDayOfWeek = firstDay.getDay();

    let offset = rawFirstDayOfWeek;
    if (weekStartsOn === "Monday") {
      offset = (rawFirstDayOfWeek + 6) % 7;
    }

    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    // Prev month padding cells
    for (let i = offset - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      cells.push({
        day: dayNum,
        inCurrentMonth: false,
        dateKey: `prev-${dayNum}`,
        programs: [],
      });
    }

    // Current month cells
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateKey = `${currentYear}-${monthStr}-${dayStr}`;
      const progs = programsByDate.get(dateKey) || [];

      cells.push({
        day,
        inCurrentMonth: true,
        dateKey,
        programs: progs,
      });
    }

    // Next month padding cells to complete row
    const totalSoFar = cells.length;
    const remainder = totalSoFar % 7;
    if (remainder !== 0) {
      const paddingNeeded = 7 - remainder;
      for (let day = 1; day <= paddingNeeded; day++) {
        cells.push({
          day,
          inCurrentMonth: false,
          dateKey: `next-${day}`,
          programs: [],
        });
      }
    }

    return cells;
  }, [currentYear, currentMonth, weekStartsOn, programsByDate]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(currentYear - 1, 11);
    } else {
      onMonthChange(currentYear, currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onMonthChange(currentYear + 1, 0);
    } else {
      onMonthChange(currentYear, currentMonth + 1);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-display font-bold text-lg text-primary">
          {monthLong} {currentYear}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label={t.prevMonth}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary-tint text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <svg
              className="w-4 h-4 fill-none stroke-current stroke-2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label={t.nextMonth}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary-tint text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <svg
              className="w-4 h-4 fill-none stroke-current stroke-2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Phones: a swipeable strip of this month's dates instead of the full grid */}
      <DateStrip
        cells={gridCells.filter((cell) => cell.inCurrentMonth)}
        year={currentYear}
        month={currentMonth}
        monthLong={monthLong}
        locale={locale}
        selectedDateKey={selectedDateKey}
        todayDateKey={todayDateKey}
        onDateSelect={onDateSelect}
      />

      {/* Weekday Labels Header */}
      <div className="hidden sm:grid grid-cols-7 text-center mb-2">
        {dayNames.map((d) => (
          <span
            key={d}
            className="text-xs font-semibold text-text-muted uppercase tracking-wider py-1"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div
        role="grid"
        aria-label={t.calendarFor(`${monthLong} ${currentYear}`)}
        className="hidden sm:grid grid-cols-7 gap-1"
      >
        {gridCells.map((cell) => {
          if (!cell.inCurrentMonth) {
            return (
              <div
                key={cell.dateKey}
                role="gridcell"
                className="h-10 flex items-center justify-center text-xs text-text-muted/30 cursor-default select-none"
              >
                {cell.day}
              </div>
            );
          }

          const hasProgram = cell.programs.length > 0;
          const isSelected = cell.dateKey === selectedDateKey;
          const isToday = cell.dateKey === todayDateKey;
          const isPast = cell.dateKey < todayDateKey && !hasProgram;
          const isClickable = hasProgram && !isPast;

          // Compute aria-label for accessibility
          const dateParts = getISTParts(cell.dateKey, locale);
          const cellAriaLabel = `${dateParts.weekdayLong}, ${cell.day} ${monthLong} ${currentYear}, ${t.programs(cell.programs.length)}`;

          return (
            <div
              key={cell.dateKey}
              role="gridcell"
              aria-selected={isSelected}
              className="relative"
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onDateSelect(cell.dateKey, cell.programs)}
                aria-label={cellAriaLabel}
                aria-pressed={isSelected}
                tabIndex={isClickable ? 0 : -1}
                className={`relative w-full h-10 rounded-xl text-xs sm:text-sm font-semibold flex flex-col items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                  isSelected
                    ? "bg-primary text-white shadow-soft"
                    : isToday
                    ? "ring-1 ring-primary text-primary font-bold bg-primary-tint/20"
                    : isClickable
                    ? "hover:bg-secondary-tint/80 text-text-main cursor-pointer"
                    : isPast
                    ? "opacity-30 text-text-muted cursor-not-allowed"
                    : "opacity-50 text-text-muted cursor-default"
                }`}
              >
                <span>{cell.day}</span>

                {/* Secondary Dot for Days with Programs */}
                {hasProgram && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 transition-colors ${
                      isSelected ? "bg-secondary" : "bg-secondary"
                    }`}
                  />
                )}

                {/* Count badge for days with >1 program */}
                {cell.programs.length > 1 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-secondary text-primary font-black text-[9px] px-1 shadow-xs">
                    {cell.programs.length}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

type DayCell = { day: number; dateKey: string; programs: Program[] };

/**
 * Phone layout of the calendar: every day of the month in one horizontally scrolling row,
 * weekday above the number, program days marked with a gold dot. It keeps the selected
 * day (or today) in view as the month or selection changes.
 */
const DateStrip: React.FC<{
  cells: DayCell[];
  year: number;
  month: number;
  monthLong: string;
  locale: Locale;
  selectedDateKey: string;
  todayDateKey: string;
  onDateSelect: (dateKey: string, programs: Program[]) => void;
}> = ({ cells, year, month, monthLong, locale, selectedDateKey, todayDateKey, onDateSelect }) => {
  const t = useCopy(copy);
  const stripRef = useRef<HTMLDivElement>(null);
  const programDays = cells.filter((cell) => cell.programs.length > 0).length;

  useEffect(() => {
    const strip = stripRef.current;

    if (!strip) return;

    const focusKey = [selectedDateKey, todayDateKey].find((key) => key && strip.querySelector(`[data-date="${key}"]`));
    const target =
      (focusKey && strip.querySelector<HTMLElement>(`[data-date="${focusKey}"]`)) ||
      strip.querySelector<HTMLElement>("[data-has-program]");

    // Horizontal only: scrollIntoView would also move the page.
    strip.scrollTo({
      left: target ? target.offsetLeft - strip.clientWidth / 2 + target.clientWidth / 2 : 0,
      behavior: "auto",
    });
  }, [year, month, selectedDateKey, todayDateKey]);

  return (
    <div className="sm:hidden">
      <div
        ref={stripRef}
        role="listbox"
        aria-label={t.daysIn(`${monthLong} ${year}`)}
        className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cells.map((cell) => {
          const hasProgram = cell.programs.length > 0;
          const isSelected = cell.dateKey === selectedDateKey;
          const isToday = cell.dateKey === todayDateKey;
          const isPast = cell.dateKey < todayDateKey && !hasProgram;
          const isClickable = hasProgram && !isPast;
          const weekday = new Date(year, month, cell.day).toLocaleDateString(intlLocale[locale], { weekday: "short" });

          return (
            <button
              key={cell.dateKey}
              type="button"
              role="option"
              data-date={cell.dateKey}
              data-has-program={hasProgram || undefined}
              aria-selected={isSelected}
              aria-label={`${weekday} ${cell.day} ${monthLong}, ${t.programs(cell.programs.length)}`}
              disabled={!isClickable}
              onClick={() => isClickable && onDateSelect(cell.dateKey, cell.programs)}
              className={`relative flex w-[3.25rem] shrink-0 snap-center flex-col items-center gap-0.5 rounded-2xl border py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                isSelected
                  ? "border-primary bg-primary text-white shadow-soft"
                  : isClickable
                    ? "border-secondary/40 bg-secondary-tint/60 text-primary"
                    : isToday
                      ? "border-primary/40 text-primary"
                      : "border-transparent text-text-muted/50"
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${isSelected ? "text-white/70" : ""}`}>
                {weekday}
              </span>
              <span className="text-base font-bold leading-none">{cell.day}</span>
              <span
                aria-hidden="true"
                className={`mt-1 h-1.5 w-1.5 rounded-full ${hasProgram ? "bg-secondary" : "bg-transparent"}`}
              />
              {cell.programs.length > 1 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[9px] font-black text-primary">
                  {cell.programs.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-text-muted">
        {programDays === 0
          ? t.noneThisMonth
          : t.programDays(programDays)}
      </p>
    </div>
  );
};
