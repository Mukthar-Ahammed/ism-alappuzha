import React from "react";
import { cn } from "@/lib/utils/cn";

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
  titleClassName?: string;
  titleId?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  align = "left",
  className,
  titleClassName,
  titleId,
  ...props
}) => {
  const alignClasses = {
    left: "text-left items-start",
    center: "text-center items-center mx-auto",
    right: "text-right items-end ml-auto",
  };

  return (
    <div
      className={cn(
        "flex flex-col mb-12 md:mb-16 max-w-3xl",
        alignClasses[align],
        className
      )}
      {...props}
    >
      <h2
        id={titleId}
        className={cn(
          "font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight leading-[1.1] text-foreground",
          titleClassName
        )}
      >
        {title}
      </h2>

      {subtitle && (
        <p className="mt-4 text-lg sm:text-xl font-body font-light leading-relaxed text-foreground/75">
          {subtitle}
        </p>
      )}
    </div>
  );
};
