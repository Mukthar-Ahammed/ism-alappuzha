"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

export interface ChipsProps {
  categories: string[];
  activeCategory: string;
  onChange: (category: string) => void;
  className?: string;
  /** Display text for a category; the category value itself stays the filter key. */
  getLabel?: (category: string) => string;
  /** Accessible name of the chip group. */
  label?: string;
  /** "light" = white/tinted bg (default), "dark" = dark green bg */
  variant?: "light" | "dark";
}

export const Chips: React.FC<ChipsProps> = ({
  categories,
  activeCategory,
  onChange,
  getLabel,
  label = "Category filter",
  className,
  variant = "light",
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto overscroll-x-contain pb-2 scrollbar-none font-body",
        className
      )}
      role="tablist"
      aria-label={label}
    >
      {categories.map((category) => {
        const isActive = activeCategory === category;

        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(category)}
            className={cn(
              "inline-flex min-h-10 sm:min-h-0 shrink-0 items-center px-4 sm:px-5 py-2 rounded-full text-[13px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
              variant === "dark"
                ? isActive
                  ? "bg-secondary text-primary shadow-xs"
                  : "bg-white/15 text-white hover:bg-white/25"
                : isActive
                  ? "bg-primary text-white shadow-xs"
                  : "bg-primary/8 text-primary hover:bg-primary/15"
            )}
          >
            {getLabel ? getLabel(category) : category}
          </button>
        );
      })}
    </div>
  );
};
