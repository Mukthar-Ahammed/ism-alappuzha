import React from "react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { programsContent } from "@/lib/constants/content";

export const Programs: React.FC = () => {
  return (
    <Section id={programsContent.id} bg="surface">
      <SectionHeading
        title={programsContent.heading}
        subtitle={programsContent.subtitle}
      />
      <p className="text-sm font-body text-foreground/70 italic border-l-2 border-accent pl-4 py-1">
        {programsContent.placeholderText}
      </p>
    </Section>
  );
};
