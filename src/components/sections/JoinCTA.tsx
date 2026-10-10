import React from "react";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { GirihPattern } from "@/components/patterns/GirihPattern";
import { joinCtaContent } from "@/lib/constants/content";

export const JoinCTA: React.FC = () => {
  return (
    <Section
      id={joinCtaContent.id}
      bg="background"
      className="relative text-center py-28 md:py-36 border-y border-accent/40"
    >
      <GirihPattern opacity={0.15} size={130} />
      <div className="relative z-10 max-w-3xl mx-auto px-4">
        <span className="text-accent uppercase tracking-[0.2em] text-xs font-body font-semibold mb-4 block">
          Get Involved
        </span>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground font-normal tracking-tight leading-tight">
          {joinCtaContent.heading}
        </h2>
        <p className="mt-6 text-lg text-foreground/80 font-body max-w-xl mx-auto leading-relaxed">
          {joinCtaContent.subtitle}
        </p>
        <p className="mt-4 text-xs font-body text-foreground/60 italic">
          {joinCtaContent.placeholderText}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button variant="accent" size="lg">
            Apply for Membership
          </Button>
          <Button variant="outline" size="lg">
            Contact Campus Directory
          </Button>
        </div>
      </div>
    </Section>
  );
};
