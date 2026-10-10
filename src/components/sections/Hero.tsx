"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { HeroQuranCanvas } from "@/components/3d/HeroQuranCanvas";
import { siteData } from "@/data/site";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

export const Hero: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();

  const headlineWords = siteData.tagline.split(" "); // ["Learn.", "Practise.", "Serve."]

  // Animation variants for word-by-word upward reveal from overflow mask
  const wordVariants: Variants = {
    hidden: prefersReducedMotion
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y: "100%" },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 1, 0.5, 1],
        delay: i * 0.18 + 0.2,
      },
    }),
  };

  const fadeUpVariants: Variants = {
    hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.8,
      },
    },
  };

  return (
    <section
      id="top"
      className="relative min-h-[calc(100vh-80px)] flex items-center justify-center pt-28 pb-16 px-6 font-body bg-bg text-text-main overflow-hidden"
    >
      {/* Soft Blurred Background Shapes */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-primary-tint rounded-full blur-3xl pointer-events-none -translate-y-12" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-secondary-tint rounded-full blur-3xl pointer-events-none translate-y-12" />

      <Container className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Tagline, Buttons */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-8">
            {/* Headline revealed word-by-word from mask */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-primary tracking-tight leading-[1.05] flex flex-wrap gap-x-3.5 sm:gap-x-5">
              {headlineWords.map((word, idx) => (
                <span key={idx} className="overflow-hidden inline-block py-1">
                  <motion.span
                    custom={idx}
                    variants={wordVariants}
                    initial="hidden"
                    animate="visible"
                    className="inline-block text-primary"
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </h1>

            {/* Subtitle / Tagline */}
            <motion.p
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="text-base sm:text-lg lg:text-xl text-text-muted max-w-xl leading-relaxed font-body"
            >
              {siteData.description}
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap items-center gap-4"
            >
              <a
                href="#videos"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-7 py-3.5 rounded-full font-medium text-sm transition-all duration-200 shadow-soft hover:shadow-floating focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <span>Watch now</span>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </a>

              <a
                href="#qna"
                className="inline-flex items-center gap-2 bg-secondary-tint hover:bg-secondary/20 text-primary border border-secondary/30 px-7 py-3.5 rounded-full font-medium text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <span>Ask a question</span>
                <svg
                  className="w-4 h-4 stroke-current fill-none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </a>
            </motion.div>
          </div>

          {/* Right Column: 3D Quran Canvas locked right inside Hero */}
          <div className="lg:col-span-5 w-full">
            <HeroQuranCanvas />
          </div>
        </div>
      </Container>
    </section>
  );
};
