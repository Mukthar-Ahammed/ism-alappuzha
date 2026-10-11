import React from "react";
import { cn } from "@/lib/utils/cn";

type BrandLoaderProps = {
  /** Read to screen readers and shown under the bars (page and overlay variants). */
  label?: string;
  /** page: fills the screen. inline: sits in a section. overlay: over dark content. */
  variant?: "page" | "inline" | "overlay";
  className?: string;
};

/**
 * The site loader: three bars sliding through (page-loader in globals.css, from
 * Uiverse.io by Shoh2008). Pure CSS, so it renders from the server with no JavaScript,
 * and it holds still for people who prefer reduced motion.
 */
export function BrandLoader({ label = "Loading", variant = "inline", className }: BrandLoaderProps) {
  const onDark = variant === "overlay";

  const mark = (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-5">
      <div
        aria-hidden="true"
        className={cn("page-loader", variant !== "inline" && "page-loader--large", onDark && "page-loader--on-dark")}
      />

      {variant === "inline" ? (
        <span className="sr-only">{label}</span>
      ) : (
        <p
          className={cn(
            "flex items-baseline gap-0.5 font-display text-sm font-semibold tracking-wide",
            onDark ? "text-white/80" : "text-primary"
          )}
        >
          {label}
          <span aria-hidden="true" className="brand-loader-dot">.</span>
          <span aria-hidden="true" className="brand-loader-dot [animation-delay:0.2s]">.</span>
          <span aria-hidden="true" className="brand-loader-dot [animation-delay:0.4s]">.</span>
        </p>
      )}
    </div>
  );

  if (variant === "page") {
    return (
      <main className={cn("flex min-h-[70vh] items-center justify-center bg-bg px-6 py-24", className)}>
        {mark}
      </main>
    );
  }

  return <div className={cn("flex items-center justify-center", className)}>{mark}</div>;
}

/** Shown while a pop-up's code downloads (video player, issue reader, study mode). */
export function ModalLoader({ label = "Opening" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,#1d3a31_0%,#0c1b16_70%)]">
      <BrandLoader variant="overlay" label={label} />
    </div>
  );
}
