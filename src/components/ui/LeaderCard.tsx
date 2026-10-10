"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Leader } from "@/lib/types/leader";
import { cn } from "@/lib/utils/cn";

export interface LeaderCardProps {
  leader: Leader;
  className?: string;
}

/* social icons */
const EmailIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const InstagramIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeLinecap="round" strokeWidth={2.5} />
  </svg>
);

export const LeaderCard: React.FC<LeaderCardProps> = ({ leader, className }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-primary/5 cursor-default",
        className
      )}
    >
      {/* Photo — fills the card */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-primary/10">
        {!imgError && leader.photo && !leader.photo.endsWith(".svg") ? (
          <Image
            src={leader.photo}
            alt={leader.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Fallback avatar placeholder */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/15 to-primary/30">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-3">
              <span className="font-display text-2xl font-bold text-primary/60">
                {leader.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            </div>
          </div>
        )}

        {/* Bottom frosted label — always visible */}
        <div className="absolute bottom-0 inset-x-0 px-4 py-3.5 bg-white/90 backdrop-blur-sm border-t border-primary/8">
          <p className="font-display text-[13px] font-bold text-primary leading-tight">
            {leader.name}
          </p>
          <p className="text-[11px] text-text-muted font-medium mt-0.5 leading-tight">
            {leader.role}
          </p>
        </div>
      </div>

      {/* Hover overlay — social links + bio snippet */}
      <div className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-100 transition-all duration-350 flex flex-col justify-between p-5 pointer-events-none group-hover:pointer-events-auto">
        {/* Bio */}
        <p className="text-white/80 text-xs leading-relaxed mt-auto pt-10">
          {leader.bio}
        </p>

        {/* Social links */}
        {(leader.email || leader.linkedin || leader.instagram) && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15">
            {leader.email && (
              <a
                href={`mailto:${leader.email}`}
                aria-label={`Email ${leader.name}`}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-secondary flex items-center justify-center text-white hover:text-primary transition-colors"
              >
                <EmailIcon />
              </a>
            )}
            {leader.linkedin && (
              <a
                href={leader.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${leader.name} on LinkedIn`}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-secondary flex items-center justify-center text-white hover:text-primary transition-colors"
              >
                <LinkedInIcon />
              </a>
            )}
            {leader.instagram && (
              <a
                href={leader.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${leader.name} on Instagram`}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-secondary flex items-center justify-center text-white hover:text-primary transition-colors"
              >
                <InstagramIcon />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
