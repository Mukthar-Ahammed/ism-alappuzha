"use client";

import React, { useState, useMemo } from "react";
import { siteData } from "@/data/site";
import { programsData, getSortedPrograms, type Program } from "@/data/programs";
import { ProgramCalendar } from "./ProgramCalendar";
import { ProgramDetails } from "./ProgramDetails";
import { getISTParts, isProgramUpcoming } from "@/lib/utils/dateUtils";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

export const NextProgramCard: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

  // Get current time & sorted programs
  const [now] = useState(() => new Date());
  const sortedPrograms = useMemo(() => getSortedPrograms(programsData), []);

  const todayDateKey = useMemo(() => getISTParts(now).dateKey, [now]);

  // Filter only upcoming programs (relative to Asia/Kolkata)
  const upcomingPrograms = useMemo(() => {
    return sortedPrograms.filter((p) => isProgramUpcoming(p, now));
  }, [sortedPrograms, now]);

  // Map all programs by dateKey for calendar markers
  const programsByDate = useMemo(() => {
    const map = new Map<string, Program[]>();
    for (const prog of sortedPrograms) {
      const parts = getISTParts(prog.date);
      const existing = map.get(parts.dateKey) || [];
      existing.push(prog);
      map.set(parts.dateKey, existing);
    }
    return map;
  }, [sortedPrograms]);

  // Find initial next upcoming program on mount
  const firstUpcoming = upcomingPrograms.length > 0 ? upcomingPrograms[0] : null;

  const initialYearMonth = useMemo(() => {
    if (firstUpcoming) {
      const parts = getISTParts(firstUpcoming.date);
      return { year: parts.year, month: parts.month, dateKey: parts.dateKey };
    }
    const parts = getISTParts(now);
    return { year: parts.year, month: parts.month, dateKey: "" };
  }, [firstUpcoming, now]);

  const [currentYear, setCurrentYear] = useState(initialYearMonth.year);
  const [currentMonth, setCurrentMonth] = useState(initialYearMonth.month);
  const [selectedDateKey, setSelectedDateKey] = useState(initialYearMonth.dateKey);
  const [selectedProgramId, setSelectedProgramId] = useState(
    firstUpcoming ? firstUpcoming.id : ""
  );

  // Programs on the currently selected date
  const dayPrograms = useMemo(() => {
    if (!selectedDateKey) return [];
    return programsByDate.get(selectedDateKey) || [];
  }, [selectedDateKey, programsByDate]);

  // Selected program object
  const selectedProgram = useMemo(() => {
    if (!selectedProgramId) return null;
    return sortedPrograms.find((p) => p.id === selectedProgramId) || null;
  }, [selectedProgramId, sortedPrograms]);

  // Find index in upcoming list for Next / Prev navigation
  const upcomingIndex = useMemo(() => {
    if (!selectedProgram) return -1;
    return upcomingPrograms.findIndex((p) => p.id === selectedProgram.id);
  }, [selectedProgram, upcomingPrograms]);

  const hasPrevProgram = upcomingIndex > 0;
  const hasNextProgram =
    upcomingIndex >= 0 && upcomingIndex < upcomingPrograms.length - 1;

  // Handle month header change (< and >)
  const handleMonthChange = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  // Handle day click in calendar
  const handleDateSelect = (dateKey: string, progs: Program[]) => {
    setSelectedDateKey(dateKey);
    if (progs.length > 0) {
      setSelectedProgramId(progs[0].id);
    }
  };

  // Handle program item selection when a day has >1 program
  const handleSelectProgram = (program: Program) => {
    setSelectedProgramId(program.id);
  };

  // Navigation: Jump to previous upcoming program
  const handlePrevProgram = () => {
    if (!hasPrevProgram) return;
    const targetProg = upcomingPrograms[upcomingIndex - 1];
    if (targetProg) {
      const parts = getISTParts(targetProg.date);
      setCurrentYear(parts.year);
      setCurrentMonth(parts.month);
      setSelectedDateKey(parts.dateKey);
      setSelectedProgramId(targetProg.id);
    }
  };

  // Navigation: Jump to next upcoming program
  const handleNextProgram = () => {
    if (!hasNextProgram) return;
    const targetProg = upcomingPrograms[upcomingIndex + 1];
    if (targetProg) {
      const parts = getISTParts(targetProg.date);
      setCurrentYear(parts.year);
      setCurrentMonth(parts.month);
      setSelectedDateKey(parts.dateKey);
      setSelectedProgramId(targetProg.id);
    }
  };

  return (
    <div className="w-full bg-white rounded-[22px] border border-border-subtle/50 shadow-floating overflow-hidden text-left">
      <div className="grid grid-cols-1 min-[860px]:grid-cols-2 divide-y min-[860px]:divide-y-0 min-[860px]:divide-x divide-border-subtle/40">
        {/* Left Half: Month Calendar */}
        <div className="p-6 sm:p-8 flex flex-col justify-between bg-white">
          <ProgramCalendar
            currentYear={currentYear}
            currentMonth={currentMonth}
            selectedDateKey={selectedDateKey}
            programsByDate={programsByDate}
            weekStartsOn={siteData.weekStartsOn}
            onMonthChange={handleMonthChange}
            onDateSelect={handleDateSelect}
            todayDateKey={todayDateKey}
          />
        </div>

        {/* Right Half: Program Details */}
        <div className="p-6 sm:p-8 flex flex-col justify-between bg-white/50">
          <ProgramDetails
            program={selectedProgram}
            dayPrograms={dayPrograms}
            selectedProgramId={selectedProgramId}
            onSelectProgram={handleSelectProgram}
            hasPrevProgram={hasPrevProgram}
            hasNextProgram={hasNextProgram}
            onPrevProgram={handlePrevProgram}
            onNextProgram={handleNextProgram}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
      </div>
    </div>
  );
};
