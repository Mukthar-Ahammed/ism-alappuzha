import React from "react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { mediaFeedContent } from "@/lib/constants/content";

export const MediaFeed: React.FC = () => {
  return (
    <Section id={mediaFeedContent.id} bg="surface">
      <SectionHeading
        title={mediaFeedContent.heading}
        subtitle={mediaFeedContent.subtitle}
      />
      <p className="text-sm font-body text-foreground/70 italic border-l-2 border-accent pl-4 py-1">
        {mediaFeedContent.placeholderText}
      </p>
    </Section>
  );
};
