"use client";

import React from "react";
import { Container } from "@/components/ui/Container";
import { HeroQuran } from "@/components/3d/HeroQuran";
import { HeroPattern } from "@/components/sections/HeroPattern";
import { siteData } from "@/data/site";
import { defineCopy, useCopy } from "@/lib/i18n/locale";

const copy = defineCopy({
  en: {
    tagline: siteData.tagline,
    description: siteData.description,
    watchNow: "Watch now",
    ask: "Ask a question",
  },
  ml: {
    tagline: "പഠിക്കുക. പ്രവർത്തിക്കുക. സേവിക്കുക.",
    description:
      "ആലപ്പുഴ ജില്ലയിലെ യുവതയെ ആധികാരിക ഇസ്‌ലാമിക അറിവിലും ധാർമിക ജീവിതത്തിലും ധീരമായ സാമൂഹിക നേതൃത്വത്തിലും ഉറപ്പിച്ചുനിർത്തുന്നു.",
    watchNow: "ഇപ്പോൾ കാണുക",
    ask: "ചോദ്യം ചോദിക്കുക",
  },
});

// The entrance animation is CSS (hero-rise / hero-fade-up in globals.css), so the headline
// animates from the first paint instead of staying hidden until JavaScript has loaded.
// Phones use the desktop design, stacked: headline, text and buttons, then the Quran.
export const Hero: React.FC = () => {
  const t = useCopy(copy);
  const headlineWords = t.tagline.split(" "); // ["Learn.", "Practise.", "Serve."]

  return (
    <section
      id="top"
      className="relative lg:min-h-[calc(100svh-80px)] flex items-center justify-center pt-10 pb-12 sm:pt-16 sm:pb-16 lg:pt-28 font-body bg-bg text-text-main overflow-hidden"
    >
      {/* Islamic geometric pattern, faded away from the headline */}
      <HeroPattern />

      {/* Soft Blurred Background Shapes */}
      <div className="absolute top-10 left-1/4 w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] bg-primary-tint rounded-full blur-3xl pointer-events-none -translate-y-12" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] bg-secondary-tint rounded-full blur-3xl pointer-events-none translate-y-12" />

      <Container className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Tagline, Buttons */}
          <div className="lg:col-span-7 flex flex-col items-center text-center lg:items-start lg:text-left space-y-6 sm:space-y-8">
            {/* Headline revealed word-by-word from mask */}
            <h1 className="font-display text-[2.75rem] min-[380px]:text-5xl sm:text-6xl lg:text-7xl [html:lang(ml)_&]:max-sm:text-[1.875rem] font-bold text-primary tracking-tight leading-[1.05] flex flex-wrap justify-center lg:justify-start gap-x-3.5 sm:gap-x-5">
              {headlineWords.map((word, idx) => (
                <span key={idx} className="overflow-hidden inline-block py-1">
                  <span
                    className="hero-rise inline-block text-primary"
                    style={{ animationDelay: `${idx * 0.18 + 0.2}s` }}
                  >
                    {word}
                  </span>
                </span>
              ))}
            </h1>

            {/* Subtitle / Tagline */}
            <p className="hero-fade-up text-base sm:text-lg lg:text-xl text-text-muted max-w-xl leading-relaxed font-body">
              {t.description}
            </p>

            {/* Action Buttons */}
            <div className="hero-fade-up flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <a
                href="#videos"
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 sm:px-7 py-3.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200 shadow-soft hover:shadow-floating focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <span>{t.watchNow}</span>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </a>

              <a
                href="#qna"
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-secondary-tint hover:bg-secondary/20 text-primary border border-secondary/30 px-5 sm:px-7 py-3.5 rounded-full font-medium text-sm whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                <span>{t.ask}</span>
                <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Column: 3D Quran canvas locked right inside Hero */}
          <div className="lg:col-span-5 w-full">
            <HeroQuran />
          </div>
        </div>
      </Container>
    </section>
  );
};
