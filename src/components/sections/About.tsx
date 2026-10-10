import React from "react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { aboutContent } from "@/lib/constants/content";
import { GirihPattern } from "@/components/patterns/GirihPattern";

export const About: React.FC = () => {
  return (
    <Section id={aboutContent.id} bg="background" className="relative">
      <GirihPattern opacity={0.06} size={110} />
      <SectionHeading
        title={aboutContent.heading}
        subtitle={aboutContent.subtitle}
      />
      <p className="text-sm font-body text-foreground/70 italic border-l-2 border-accent pl-4 py-1">
        {aboutContent.placeholderText}
      </p>
    </Section>
  );
};
