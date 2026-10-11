import React from "react";
import Image from "next/image";

/** A still of the 3D Quran in its default pose, shown until (or instead of) the live model. */
export const ModelPoster: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <Image
        src="/images/hero/quran-poster.webp"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 490px, (min-width: 640px) 70vw, 90vw"
        className="object-contain"
      />
    </div>
  );
};
