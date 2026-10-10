import React from "react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { faqContent } from "@/lib/constants/content";

export const FAQ: React.FC = () => {
  return (
    <Section id={faqContent.id} bg="background">
      <SectionHeading
        title={faqContent.heading}
        subtitle={faqContent.subtitle}
      />
      <p className="text-sm font-body text-foreground/70 italic border-l-2 border-accent pl-4 py-1">
        {faqContent.placeholderText}
      </p>
    </Section>
  );
};
