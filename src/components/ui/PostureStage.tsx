"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { useLocale } from "@/lib/i18n/locale";

const postureNamesMl: Record<string, string> = {
  niyyah: "നിയ്യത്ത്",
  takbeer: "തക്ബീർ",
  qiyam: "ഖിയാം",
  ruku: "റുകൂഅ്",
  itidal: "ഇഅ്തിദാൽ",
  sujood: "സുജൂദ്",
  jalsa: "ജൽസ",
  tashahhud: "തശഹ്ഹുദ്",
  salam: "സലാം",
};

export interface PostureStageProps {
  postureKey: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const PostureStage: React.FC<PostureStageProps> = ({
  postureKey,
  className,
  size = "md",
}) => {
  const locale = useLocale();
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-28 h-28 sm:w-36 sm:h-36",
    lg: "w-44 h-44 sm:w-56 sm:h-56",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center bg-primary-tint border border-primary/10 rounded-2xl p-4 transition-all duration-300",
        sizeClasses[size],
        className
      )}
    >
      {/* SVG Posture Line-Art Illustrations */}
      <svg
        className="w-full h-full text-primary"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Base Ground Line */}
        <line x1="10" y1="90" x2="90" y2="90" stroke="#C9A24B" strokeWidth="2" strokeDasharray="3 3" />

        {/* 1. Niyyah / Standing Erect */}
        {(postureKey === "niyyah" || postureKey === "itidal") && (
          <g>
            <circle cx="50" cy="22" r="7" stroke="#10241E" fill="#10241E" />
            <line x1="50" y1="29" x2="50" y2="62" stroke="#10241E" />
            <line x1="50" y1="36" x2="42" y2="52" stroke="#10241E" />
            <line x1="50" y1="36" x2="58" y2="52" stroke="#10241E" />
            <line x1="50" y1="62" x2="44" y2="88" stroke="#10241E" />
            <line x1="50" y1="62" x2="56" y2="88" stroke="#10241E" />
          </g>
        )}

        {/* 2. Takbeer al-Ihram (Hands Raised) */}
        {postureKey === "takbeer" && (
          <g>
            <circle cx="50" cy="22" r="7" stroke="#10241E" fill="#10241E" />
            <line x1="50" y1="29" x2="50" y2="62" stroke="#10241E" />
            <path d="M 36 24 L 40 36 L 50 36 L 60 36 L 64 24" stroke="#C9A24B" strokeWidth="2.5" />
            <line x1="50" y1="62" x2="44" y2="88" stroke="#10241E" />
            <line x1="50" y1="62" x2="56" y2="88" stroke="#10241E" />
          </g>
        )}

        {/* 3. Qiyam (Hands Folded Chest) */}
        {postureKey === "qiyam" && (
          <g>
            <circle cx="50" cy="22" r="7" stroke="#10241E" fill="#10241E" />
            <line x1="50" y1="29" x2="50" y2="62" stroke="#10241E" />
            <path d="M 42 38 Q 50 42 58 38" stroke="#C9A24B" strokeWidth="3" />
            <line x1="50" y1="62" x2="44" y2="88" stroke="#10241E" />
            <line x1="50" y1="62" x2="56" y2="88" stroke="#10241E" />
          </g>
        )}

        {/* 4. Ruku (Bowing at Waist) */}
        {postureKey === "ruku" && (
          <g>
            <circle cx="28" cy="46" r="7" stroke="#10241E" fill="#10241E" />
            <line x1="35" y1="46" x2="68" y2="46" stroke="#10241E" strokeWidth="3" />
            <line x1="68" y1="46" x2="68" y2="88" stroke="#10241E" />
            <line x1="38" y1="46" x2="65" y2="68" stroke="#C9A24B" strokeWidth="2.5" />
          </g>
        )}

        {/* 5. Sujood (Prostration on Ground) */}
        {postureKey === "sujood" && (
          <g>
            <circle cx="22" cy="78" r="6" stroke="#10241E" fill="#10241E" />
            <path d="M 28 80 Q 45 60 62 76 L 78 88" stroke="#10241E" strokeWidth="3" />
            <line x1="30" y1="84" x2="44" y2="76" stroke="#C9A24B" strokeWidth="2.5" />
          </g>
        )}

        {/* 6. Jalsa / Tashahhud (Sitting) */}
        {(postureKey === "jalsa" || postureKey === "tashahhud") && (
          <g>
            <circle cx="42" cy="46" r="7" stroke="#10241E" fill="#10241E" />
            <line x1="42" y1="53" x2="42" y2="74" stroke="#10241E" />
            <line x1="42" y1="74" x2="68" y2="88" stroke="#10241E" />
            <path d="M 42 60 L 58 72" stroke="#C9A24B" strokeWidth="2.5" />
            {postureKey === "tashahhud" && (
              <line x1="58" y1="72" x2="66" y2="68" stroke="#C9A24B" strokeWidth="2" />
            )}
          </g>
        )}

        {/* 7. Salam (Turning Head) */}
        {postureKey === "salam" && (
          <g>
            <circle cx="48" cy="46" r="7" stroke="#C9A24B" fill="#C9A24B" />
            <line x1="42" y1="53" x2="42" y2="74" stroke="#10241E" />
            <line x1="42" y1="74" x2="68" y2="88" stroke="#10241E" />
            <path d="M 55 42 L 64 42" stroke="#C9A24B" strokeWidth="2" markerEnd="url(#arrow)" />
          </g>
        )}
      </svg>

      {/* Posture Name Overlay Badge */}
      <span className="absolute bottom-1 right-2 text-[9px] font-mono text-text-muted uppercase tracking-wider">
        {locale === "ml" ? postureNamesMl[postureKey] ?? postureKey : postureKey}
      </span>
    </div>
  );
};
