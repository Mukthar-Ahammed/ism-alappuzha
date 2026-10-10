"use client";

import React from "react";
import type { Program } from "@/data/programs";
import { getISTParts } from "@/lib/utils/dateUtils";

interface ProgramListProps {
  programs: Program[];
  selectedProgramId: string;
  onSelectProgram: (program: Program) => void;
}

export const ProgramList: React.FC<ProgramListProps> = ({
  programs,
  selectedProgramId,
  onSelectProgram,
}) => {
  if (programs.length <= 1) return null;

  return (
    <div className="flex flex-col gap-2 mb-4 pb-3 border-b border-border-subtle/40">
      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
        Programs on this date ({programs.length})
      </span>
      <div className="flex flex-col gap-1.5">
        {programs.map((prog) => {
          const isSelected = prog.id === selectedProgramId;
          const parts = getISTParts(prog.date);
          const cleanTitle = prog.title.replace(/^TODO:\s*/, "");

          return (
            <button
              key={prog.id}
              type="button"
              onClick={() => onSelectProgram(prog)}
              className={`flex items-center justify-between text-left px-3 py-2 rounded-xl border text-xs sm:text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                isSelected
                  ? "bg-secondary-tint/80 border-secondary text-primary font-bold shadow-xs"
                  : "bg-white hover:bg-primary-tint/30 border-border-subtle/50 text-text-main"
              }`}
            >
              <span className="font-medium line-clamp-1 flex-1 pr-2">
                {cleanTitle}
              </span>
              <span className="text-[11px] font-semibold text-secondary shrink-0">
                {parts.timeFormatted}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
