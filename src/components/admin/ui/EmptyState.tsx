import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  title,
  description,
  className,
  children,
}: HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-bg p-8 text-center shadow-soft",
        "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(201,162,75,0.14),transparent_34%)] before:content-['']",
        className
      )}
    >
      <div className="relative">
        <h2 className="font-display text-2xl font-semibold text-primary">{title}</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-muted">
          {description}
        </p>
        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>
  );
}
