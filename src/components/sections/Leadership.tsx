"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { LeaderCard } from "@/components/ui/LeaderCard";
import { LEADERS } from "@/lib/constants/leaders";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay },
  }),
};

export const Leadership: React.FC = () => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const viewport = { once: true, margin: "-80px" as const };
  const init = prefersReducedMotion ? "visible" : "hidden";

  return (
    <section
      id="leaders"
      className="py-24 md:py-32 bg-[#F5F3EF] font-body overflow-hidden"
      aria-labelledby="leadership-heading"
    >
      <Container>

        {/* ── Top pill tag ── */}
        <motion.div
          variants={fadeUp}
          custom={0}
          initial={init}
          whileInView="visible"
          viewport={viewport}
          className="inline-flex items-center gap-2 mb-6"
        >
          <span className="text-primary/40 text-xs select-none">←</span>
          <span className="text-[11px] font-semibold text-primary/50 uppercase tracking-widest border border-primary/15 px-3 py-1 rounded-full">
            Who We Are
          </span>
        </motion.div>

        {/* ── Large editorial heading ── */}
        <motion.h2
          id="leadership-heading"
          variants={fadeUp}
          custom={0.05}
          initial={init}
          whileInView="visible"
          viewport={viewport}
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-primary tracking-tight leading-none uppercase max-w-xl"
        >
          Our<br />
          Leadership
        </motion.h2>

        {/* ── Two-column intro text ── */}
        <motion.div
          variants={fadeUp}
          custom={0.12}
          initial={init}
          whileInView="visible"
          viewport={viewport}
          className="mt-10 mb-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl"
        >
          <p className="text-sm sm:text-base font-semibold text-primary leading-relaxed uppercase tracking-wide">
            Scholarly fellows, directors, and student leaders guiding our movement across campuses.
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            The Islamic Students Movement is led by a dedicated team of scholars, educators, and student organizers committed to fostering academic excellence, spiritual growth, and ethical leadership in every campus chapter across Kerala.
          </p>
        </motion.div>

        {/* ── Photo card grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 items-start">
          {LEADERS.map((leader, idx) => (
            <motion.div
              key={leader.id}
              variants={fadeUp}
              custom={0.18 + idx * 0.07}
              initial={init}
              whileInView="visible"
              viewport={viewport}
            >
              <LeaderCard leader={leader} />
            </motion.div>
          ))}

          {/* Quote accent card — matches the lime/accent card in reference */}
          <motion.div
            variants={fadeUp}
            custom={0.18 + LEADERS.length * 0.07}
            initial={init}
            whileInView="visible"
            viewport={viewport}
            className="rounded-2xl bg-secondary p-5 flex flex-col justify-between"
            style={{ aspectRatio: "3/4" }}
          >
            {/* Social icons */}
            <div className="flex items-center gap-2">
              <a
                href="https://instagram.com/ism_alappuzha"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ISM on Instagram"
                className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary flex items-center justify-center text-primary hover:text-white transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeLinecap="round" strokeWidth={2.5} />
                </svg>
              </a>
              <a
                href="https://youtube.com/@ism_alappuzha"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ISM on YouTube"
                className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary flex items-center justify-center text-primary hover:text-white transition-colors"
              >
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.3 2.8 12 2.8 12 2.8s-4.3 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.2 21.5 12 21.5 12 21.5s4.3 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15V8.6l6.6 3.2L9.7 15z" />
                </svg>
              </a>
            </div>

            {/* Quote */}
            <blockquote>
              <p className="text-primary text-sm font-semibold leading-snug">
                &ldquo;Seeking knowledge is an obligation upon every Muslim.&rdquo;
              </p>
              <footer className="text-primary/60 text-[11px] font-medium mt-2">
                — Prophet Muhammad ﷺ
              </footer>
            </blockquote>
          </motion.div>
        </div>

      </Container>
    </section>
  );
};
