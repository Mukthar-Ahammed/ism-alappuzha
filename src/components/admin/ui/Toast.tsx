import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Toast({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border border-border-subtle bg-bg px-4 py-3 text-sm font-semibold text-primary shadow-soft",
        className
      )}
      {...props}
    />
  );
}
