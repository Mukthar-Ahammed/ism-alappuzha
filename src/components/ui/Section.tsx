import React from "react";
import { cn } from "@/lib/utils/cn";
import { Container } from "./Container";

export type SectionBg = "background" | "surface" | "transparent";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  children: React.ReactNode;
  bg?: SectionBg;
  className?: string;
  containerClassName?: string;
  fullWidth?: boolean;
}

const bgVariants: Record<SectionBg, string> = {
  background: "bg-background text-foreground",
  surface: "bg-surface text-foreground border-y border-accent/10",
  transparent: "bg-transparent text-foreground",
};

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ id, children, bg = "background", className, containerClassName, fullWidth = false, ...props }, ref) => {
    return (
      <section
        ref={ref}
        id={id}
        className={cn(
          "relative w-full py-24 md:py-32 overflow-hidden",
          bgVariants[bg],
          className
        )}
        {...props}
      >
        {fullWidth ? (
          children
        ) : (
          <Container className={containerClassName}>{children}</Container>
        )}
      </section>
    );
  }
);

Section.displayName = "Section";
