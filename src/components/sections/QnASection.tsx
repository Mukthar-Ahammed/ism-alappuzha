"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { AskForm } from "@/components/ui/AskForm";
import { QaAccordion } from "@/components/ui/QaAccordion";
import { fallbackQuestions } from "@/data/qa";
import type { Question } from "@/lib/types/qa";

export const QnASection: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Scroll reveal observer
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fetch published questions
  useEffect(() => {
    let isMounted = true;

    async function fetchPublished() {
      try {
        const res = await fetch("/api/qa/published");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.questions) {
            setQuestions(data.questions);
            setLoading(false);
            return;
          }
        }
      } catch {
        /* ignore fetch error */
      }

      if (isMounted) {
        setQuestions(fallbackQuestions);
        setLoading(false);
      }
    }

    fetchPublished();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="qna"
      className="relative w-full py-24 md:py-32 bg-primary overflow-hidden"
    >
      <Container>
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 md:mb-16 max-w-3xl"
        >
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight leading-[1.1] text-white">
            Ask a question
          </h2>
          <p className="mt-4 text-lg sm:text-xl font-body font-light leading-relaxed text-white/60">
            Your question is reviewed by our scholars. Answers appear here once published.
          </p>
        </motion.div>

        {/* 2 Column Layout (Form left, Accordion right on desktop; Stacked on mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Ask Form */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <AskForm />
          </motion.div>

          {/* Right Column: Answered Questions Accordion with Scroll Stagger */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-7"
          >
            <QaAccordion questions={questions} loading={loading} />
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
