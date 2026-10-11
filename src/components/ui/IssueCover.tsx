"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Issue } from "@/data/issues";
import { cn } from "@/lib/utils/cn";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { localizeMonthName } from "@/lib/utils/dateUtils";
import { defineCopy, pickText, useCopy, useLocale } from "@/lib/i18n/locale";

const copy = defineCopy({
  en: {
    brand: "ISM ALAPPUZHA",
    journal: "JOURNAL",
    special: "Special Edition",
    pdf: "Issue PDF",
  },
  ml: {
    brand: "ഐ.എസ്.എം ആലപ്പുഴ",
    journal: "പ്രസിദ്ധീകരണം",
    special: "പ്രത്യേക പതിപ്പ്",
    pdf: "ലക്കം പി.ഡി.എഫ്",
  },
});

export interface IssueCoverProps {
  issue: Issue;
  className?: string;
  onClick?: () => void;
}

export const IssueCover: React.FC<IssueCoverProps> = ({
  issue,
  className,
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const prefersReducedMotion = usePrefersReducedMotion();
  const locale = useLocale();
  const title = pickText(locale, issue.title, issue.titleMl);
  const t = useCopy(copy);

  // Scroll-driven 3D tilt calculation
  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;

      // Distance from vertical center normalized between -1 and 1
      const deltaY = (elementCenter - viewportCenter) / viewportCenter;

      // Restrained tilt rotation limits (max 12 deg)
      const rotateX = Math.max(-12, Math.min(12, deltaY * 12));
      const rotateY = Math.max(-10, Math.min(10, deltaY * -10));

      setTilt({ rotateX, rotateY });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      style={{
        transform: prefersReducedMotion
          ? "none"
          : `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        transition: "transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)",
      }}
      className={cn(
        "group relative aspect-[3/4] w-full bg-primary rounded-r-[18px] rounded-l-[4px] overflow-hidden shadow-floating border border-primary/20 cursor-pointer font-body transition-shadow duration-300 hover:shadow-2xl",
        className
      )}
    >
      {/* Gold Spine Edge Detail */}
      <div className="absolute left-0 top-0 bottom-0 w-3.5 bg-gradient-to-r from-secondary/80 via-secondary to-secondary-hover border-r border-black/20 z-20 shadow-xs" />

      {/* Cover Image or Fallback Graphic */}
      {issue.coverImage ? (
        <div className="relative w-full h-full">
          <Image
            src={issue.coverImage}
            alt={issue.coverAlt || title}
            placeholder={issue.coverBlurDataUrl ? "blur" : "empty"}
            blurDataURL={issue.coverBlurDataUrl}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover pl-3.5"
            loading="lazy"
          />

        </div>
      ) : (
        <div className="relative w-full h-full bg-primary pl-7 p-6 flex flex-col justify-between text-white border border-secondary/20">
          <div className="flex items-center justify-between border-b border-secondary/30 pb-3">
            <span className="font-display text-sm font-bold text-secondary tracking-wider">
              {t.brand}
            </span>
            <span className="text-[10px] text-white/60 uppercase">{t.journal}</span>
          </div>

          <div className="my-auto">
            <h3 className="font-display text-2xl font-bold text-white leading-tight tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-secondary font-medium mt-2">
              {localizeMonthName(issue.month, locale)} {issue.year}
            </p>
          </div>

          <div className="pt-3 border-t border-white/10 text-[10px] text-white/50 flex justify-between">
            <span>{t.special}</span>
            <span>{t.pdf}</span>
          </div>
        </div>
      )}
    </div>
  );
};
