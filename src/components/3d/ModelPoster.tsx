"use client";

import React from "react";
import Image from "next/image";
import { siteData } from "@/data/site";

interface ModelPosterProps {
  className?: string;
}

export const ModelPoster: React.FC<ModelPosterProps> = ({ className = "" }) => {
  return (
    <div
      className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center">
        {/* Soft background glow halo */}
        <div className="absolute inset-0 rounded-full bg-secondary/15 blur-3xl transform scale-125" />

        {/* Poster image representation */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 bg-white/40 backdrop-blur-md rounded-3xl border border-secondary/20 shadow-2xl">
          <Image
            src={siteData.logo}
            alt="Quran 3D Poster Placeholder"
            width={180}
            height={180}
            className="w-36 h-36 object-contain drop-shadow-2xl animate-pulse"
            priority
          />
          <span className="mt-4 font-display text-xs tracking-wider uppercase text-secondary font-semibold">
            Holy Quran Digital Model
          </span>
        </div>
      </div>
    </div>
  );
};
