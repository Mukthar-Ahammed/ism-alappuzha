"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { liveData } from "@/data/live";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { NextProgramCard } from "@/components/program/NextProgramCard";

export const LiveNow: React.FC = () => {
  const [isLive] = useState(liveData.isLive);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Signature scroll effect: scale up to full container width as it enters viewport
  const cardScaleVariants: Variants = {
    hidden: prefersReducedMotion
      ? { opacity: 1, scale: 1 }
      : { opacity: 0.8, scale: 0.94 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 1, 0.5, 1],
      },
    },
  };

  return (
    <section
      id="live"
      className="py-20 md:py-28 bg-primary-tint border-y border-primary/10 font-body text-text-main overflow-hidden"
    >
      <Container>
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          {/* Section Header Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-primary/10 text-xs font-semibold text-primary mb-6 shadow-xs">
            {isLive ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
                </span>
                <span className="text-red-700 tracking-wide uppercase">
                  Live Broadcast Active
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-text-muted tracking-wide uppercase">
                  Broadcast Schedule
                </span>
              </>
            )}
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-bold text-primary tracking-tight">
            {isLive ? "Live Stream Now" : "Upcoming Program & Live Streams"}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-muted max-w-xl">
            {isLive
              ? "Tune in live to our ongoing district gathering broadcast."
              : "Catch our next live broadcast or explore recent recorded lectures."}
          </p>

          {/* Signature Scaling Panel */}
          <motion.div
            variants={cardScaleVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="w-full mt-10"
          >
            {isLive ? (
              /* Live Stream Video Embed Panel */
              <div className="bg-white rounded-[22px] overflow-hidden border border-primary/10 shadow-floating p-3 sm:p-4 text-left">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${liveData.liveYoutubeId}?autoplay=0`}
                    title={liveData.liveTitle}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-red-600 font-bold uppercase tracking-wider">
                      Streaming Live
                    </span>
                    <h3 className="font-display text-lg font-bold text-primary mt-0.5">
                      {liveData.liveTitle}
                    </h3>
                  </div>
                  <a
                    href={`https://www.youtube.com/channel/${liveData.channelId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <span>Watch on YouTube</span>
                    <svg
                      className="w-3.5 h-3.5 fill-current"
                      viewBox="0 0 24 24"
                    >
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ) : (
              /* Next Program Card (When offline) */
              <NextProgramCard />
            )}
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
