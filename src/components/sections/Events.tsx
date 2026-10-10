import React from "react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { eventsContent } from "@/lib/constants/content";

export const Events: React.FC = () => {
  return (
    <Section id={eventsContent.id} bg="background">
      <SectionHeading
        title={eventsContent.heading}
        subtitle={eventsContent.subtitle}
      />
      <p className="text-sm font-body text-foreground/70 italic border-l-2 border-accent pl-4 py-1">
        {eventsContent.placeholderText}
      </p>
    </Section>
  );
};
