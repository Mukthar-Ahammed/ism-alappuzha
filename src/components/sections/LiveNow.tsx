"use client";

import React from "react";
import { m, Variants } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { liveData } from "@/data/live";
import type { Program } from "@/data/programs";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { NextProgramCard } from "@/components/program/NextProgramCard";
import { LivePlayer } from "@/components/live/LivePlayer";
import { livePlatformLabels, type LivePlatform } from "@/lib/live-links";
import { liveEmbedSource } from "@/features/live/embed";
import type { PublicLive } from "@/features/live/types";
import { defineCopy, pickText, useCopy, useLocale } from "@/lib/i18n/locale";

const externalArrow = (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const copy = defineCopy({
  en: {
    watchYoutube: "Watch on YouTube",
    watchInstagram: "Watch live on Instagram",
    watchFacebook: "Watch on Facebook",
    liveActive: "Live Broadcast Active",
    schedule: "Broadcast Schedule",
    liveTitle: "Live Stream Now",
    idleTitle: "Upcoming Program & Live Streams",
    liveText: "Tune in live to our ongoing district gathering broadcast.",
    idleText: "Catch our next live broadcast or explore recent recorded lectures.",
    streaming: "Streaming Live",
    liveOn: {
      youtube: `Live on ${livePlatformLabels.youtube}`,
      facebook: `Live on ${livePlatformLabels.facebook}`,
      instagram: `Live on ${livePlatformLabels.instagram}`,
    } as Record<LivePlatform, string>,
    upcoming: "Upcoming programs",
  },
  ml: {
    watchYoutube: "യൂട്യൂബിൽ കാണുക",
    watchInstagram: "ഇൻസ്റ്റഗ്രാമിൽ തത്സമയം കാണുക",
    watchFacebook: "ഫേസ്ബുക്കിൽ കാണുക",
    liveActive: "തത്സമയ സംപ്രേഷണം നടക്കുന്നു",
    schedule: "സംപ്രേഷണ സമയക്രമം",
    liveTitle: "ഇപ്പോൾ തത്സമയം",
    idleTitle: "വരാനിരിക്കുന്ന പരിപാടികളും തത്സമയ സംപ്രേഷണങ്ങളും",
    liveText: "നടന്നുകൊണ്ടിരിക്കുന്ന ജില്ലാ സംഗമത്തിന്റെ തത്സമയ സംപ്രേഷണം കാണുക.",
    idleText: "അടുത്ത തത്സമയ സംപ്രേഷണം കാണുക, അല്ലെങ്കിൽ സമീപകാല പ്രഭാഷണങ്ങൾ കേൾക്കുക.",
    streaming: "തത്സമയം",
    liveOn: {
      youtube: "യൂട്യൂബിൽ തത്സമയം",
      facebook: "ഫേസ്ബുക്കിൽ തത്സമയം",
      instagram: "ഇൻസ്റ്റഗ്രാമിൽ തത്സമയം",
    },
    upcoming: "വരാനിരിക്കുന്ന പരിപാടികൾ",
  },
});

function watchLink(live: PublicLive, t: (typeof copy)["en"]): { href: string; label: string } {
  if (live.platform === "youtube") {
    return { href: `https://www.youtube.com/channel/${liveData.channelId}`, label: t.watchYoutube };
  }

  return {
    href: live.watchUrl ?? "#live",
    label: live.platform === "instagram" ? t.watchInstagram : t.watchFacebook,
  };
}

export const LiveNow: React.FC<{ live: PublicLive; programs: Program[] }> = ({ live, programs }) => {
  const t = useCopy(copy);
  const locale = useLocale();
  const liveTitle = pickText(locale, live.title, live.titleMl);
  const liveSpeaker = pickText(locale, live.speaker ?? "", live.speakerMl);
  const isLive = live.isLive;
  const embeddable = liveEmbedSource(live) !== null;
  const watch = watchLink(live, t);
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
      className="py-14 sm:py-20 md:py-28 bg-primary-tint border-y border-primary/10 font-body text-text-main overflow-hidden"
    >
      <Container>
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          {/* Section Header Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-primary/10 text-xs font-semibold text-primary mb-6 shadow-xs">
            {isLive ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
                </span>
                <span className="text-red-700 tracking-wide uppercase">
                  {t.liveActive}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-text-muted tracking-wide uppercase">
                  {t.schedule}
                </span>
              </>
            )}
          </div>

          <h2 className="font-display text-[1.75rem] leading-tight sm:text-5xl font-bold text-primary tracking-tight text-balance">
            {isLive ? t.liveTitle : t.idleTitle}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-text-muted max-w-xl">
            {isLive
              ? t.liveText
              : t.idleText}
          </p>

          {/* Signature Scaling Panel */}
          <m.div
            variants={cardScaleVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="w-full mt-8 sm:mt-10"
          >
            {isLive && (
              /* Live Stream Panel: click-to-load player, or a link card when the platform cannot be embedded */
              <div className="bg-white rounded-[22px] overflow-hidden border border-primary/10 shadow-floating p-2 sm:p-4 text-left">
                {embeddable && (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black">
                    <LivePlayer live={live} />
                  </div>
                )}
                <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-red-600 font-bold uppercase tracking-wider">
                      {embeddable ? t.streaming : t.liveOn[live.platform]}
                    </span>
                    <h3 className="font-display text-lg font-bold text-primary mt-0.5">
                      {liveTitle}
                    </h3>
                    {liveSpeaker && (
                      <p className="mt-0.5 text-sm text-text-muted">{liveSpeaker}</p>
                    )}
                  </div>
                  <a
                    href={watch.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full text-sm sm:text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <span>{watch.label}</span>
                    {externalArrow}
                  </a>
                </div>
              </div>
            )}
            {/* The schedule stays available below the stream while a broadcast is live. */}
            <div className={isLive ? "mt-10" : undefined}>
              {isLive && (
                <h3 className="mb-4 text-left font-display text-xl sm:text-2xl font-bold text-primary">
                  {t.upcoming}
                </h3>
              )}
              <NextProgramCard programs={programs} />
            </div>
          </m.div>
        </div>
      </Container>
    </section>
  );
};
