"use client";

import React, { useMemo } from "react";
import type { Program } from "@/data/programs";
import { getISTParts } from "@/lib/utils/dateUtils";

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
  const monthDate = useMemo(() => {
    return new Date(currentYear, currentMonth, 1);
  }, [currentYear, currentMonth]);

  const monthLong = useMemo(() => {
    return monthDate.toLocaleDateString("en-US", { month: "long" });
  }, [monthDate]);

  const dayNames = useMemo(() => {
    if (weekStartsOn === "Monday") {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    }
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  }, [weekStartsOn]);

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
            aria-label="Previous month"
            className="p-2 rounded-full hover:bg-primary-tint text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
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
            aria-label="Next month"
            className="p-2 rounded-full hover:bg-primary-tint text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
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

      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 text-center mb-2">
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
        aria-label={`Program Calendar for ${monthLong} ${currentYear}`}
        className="grid grid-cols-7 gap-1"
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
          const dateParts = getISTParts(cell.dateKey);
          const programText = hasProgram
            ? `, ${cell.programs.length} program${cell.programs.length > 1 ? "s" : ""}`
            : ", no programs";
          const cellAriaLabel = `${dateParts.weekdayLong}, ${cell.day} ${monthLong} ${currentYear}${programText}`;

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
