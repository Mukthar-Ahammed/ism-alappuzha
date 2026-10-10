import React from "react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { testimonialsContent } from "@/lib/constants/content";

export const Testimonials: React.FC = () => {
  return (
    <Section id={testimonialsContent.id} bg="surface">
      <SectionHeading
        title={testimonialsContent.heading}
        subtitle={testimonialsContent.subtitle}
      />
      <p className="text-sm font-body text-foreground/70 italic border-l-2 border-accent pl-4 py-1">
        {testimonialsContent.placeholderText}
      </p>
    </Section>
  );
};
