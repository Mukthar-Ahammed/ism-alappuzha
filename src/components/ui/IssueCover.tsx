"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Issue } from "@/data/issues";
import { cn } from "@/lib/utils/cn";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

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
            alt={issue.title}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover pl-3.5 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

        </div>
      ) : (
        <div className="relative w-full h-full bg-primary pl-7 p-6 flex flex-col justify-between text-white border border-secondary/20">
          <div className="flex items-center justify-between border-b border-secondary/30 pb-3">
            <span className="font-display text-sm font-bold text-secondary tracking-wider">
              ISM ALAPPUZHA
            </span>
            <span className="text-[10px] text-white/60 uppercase">JOURNAL</span>
          </div>

          <div className="my-auto">
            <h3 className="font-display text-2xl font-bold text-white leading-tight tracking-tight">
              {issue.title}
            </h3>
            <p className="text-xs text-secondary font-medium mt-2">
              {issue.month} {issue.year}
            </p>
          </div>

          <div className="pt-3 border-t border-white/10 text-[10px] text-white/50 flex justify-between">
            <span>Special Edition</span>
            <span>Issue PDF</span>
          </div>
        </div>
      )}
    </div>
  );
};
