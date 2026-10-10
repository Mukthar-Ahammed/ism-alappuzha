import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Tabs({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex rounded-xl border border-border-subtle bg-primary-tint p-1",
        className
      )}
      {...props}
    />
  );
}

export function Tab({
  active,
  className,
  ...props
}: HTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
        active ? "bg-bg text-primary shadow-soft" : "text-text-muted hover:text-primary",
        className
      )}
      {...props}
    />
  );
}
