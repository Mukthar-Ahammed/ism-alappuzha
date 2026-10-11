"use client";

import React from "react";
import { m, Variants } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { LeaderCard } from "@/components/ui/LeaderCard";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import type { Leader } from "@/lib/types/leader";
import { defineCopy, useCopy } from "@/lib/i18n/locale";

const copy = defineCopy({
  en: {
    tag: "Who We Are",
    titleTop: "Our",
    titleBottom: "Leadership",
    description:
      "The Islamic Students Movement is led by a dedicated team of scholars, educators, and student organizers committed to fostering academic excellence, spiritual growth, and ethical leadership in every campus chapter across Kerala.",
    subtitle:
      "Scholarly fellows, directors, and student leaders guiding our movement across campuses.",
  },
  ml: {
    tag: "ഞങ്ങൾ ആരാണ്",
    titleTop: "ഞങ്ങളുടെ",
    titleBottom: "നേതൃത്വം",
    description:
      "കേരളത്തിലെ എല്ലാ കാമ്പസ് ഘടകങ്ങളിലും അക്കാദമിക മികവും ആത്മീയ വളർച്ചയും ധാർമിക നേതൃത്വവും വളർത്താൻ പ്രതിജ്ഞാബദ്ധരായ പണ്ഡിതരും അധ്യാപകരും വിദ്യാർത്ഥി സംഘാടകരും അടങ്ങുന്ന സമർപ്പിത സംഘമാണ് ഇസ്‌ലാമിക് സ്റ്റുഡന്റ്സ് മൂവ്മെന്റിനെ നയിക്കുന്നത്.",
    subtitle:
      "കാമ്പസുകളിലുടനീളം ഞങ്ങളുടെ പ്രസ്ഥാനത്തെ നയിക്കുന്ന പണ്ഡിതരും ഭാരവാഹികളും വിദ്യാർത്ഥി നേതാക്കളും.",
  },
});

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay },
  }),
};

export const Leadership: React.FC<{ leaders: Leader[] }> = ({ leaders }) => {
  const t = useCopy(copy);
  const prefersReducedMotion = usePrefersReducedMotion();
  const viewport = { once: true, margin: "-80px" as const };
  const init = prefersReducedMotion ? "visible" : "hidden";

  return (
    <section
      id="leaders"
      className="py-16 sm:py-24 md:py-32 bg-[#F5F3EF] font-body overflow-hidden"
      aria-labelledby="leadership-heading"
    >
      <Container>

        {/* ── Top pill tag ── */}
        <m.div
          variants={fadeUp}
          custom={0}
          initial={init}
          whileInView="visible"
          viewport={viewport}
          className="inline-flex items-center gap-2 mb-6"
        >
          <span className="text-primary/40 text-xs select-none">←</span>
          <span className="text-[11px] font-semibold text-primary/50 uppercase tracking-widest border border-primary/15 px-3 py-1 rounded-full">
            {t.tag}
          </span>
        </m.div>

        {/* ── Heading with the description centred beside it ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 md:items-center">
          <m.h2
            id="leadership-heading"
            variants={fadeUp}
            custom={0.05}
            initial={init}
            whileInView="visible"
            viewport={viewport}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-primary tracking-tight leading-none uppercase max-w-xl"
          >
            {t.titleTop}<br />
            {t.titleBottom}
          </m.h2>
          <m.p
            variants={fadeUp}
            custom={0.1}
            initial={init}
            whileInView="visible"
            viewport={viewport}
            className="max-w-md md:justify-self-end text-sm sm:text-base text-text-muted leading-relaxed"
          >
            {t.description}
          </m.p>
        </div>

        <m.p
          variants={fadeUp}
          custom={0.12}
          initial={init}
          whileInView="visible"
          viewport={viewport}
          className="mt-8 mb-10 sm:mt-10 sm:mb-16 max-w-md text-sm sm:text-base font-semibold text-primary leading-relaxed uppercase tracking-wide"
        >
          {t.subtitle}
        </m.p>

        {/* ── Photo card grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 items-start">
          {leaders.map((leader, idx) => (
            <m.div
              key={leader.id}
              variants={fadeUp}
              custom={0.18 + idx * 0.07}
              initial={init}
              whileInView="visible"
              viewport={viewport}
            >
              <LeaderCard leader={leader} />
            </m.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
