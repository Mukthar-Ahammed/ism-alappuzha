import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Switch({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-6 w-11 cursor-pointer appearance-none rounded-full border border-border-subtle bg-text-muted/30 transition checked:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
        "before:block before:h-5 before:w-5 before:translate-x-0 before:rounded-full before:bg-white before:shadow before:transition checked:before:translate-x-5",
        className
      )}
      {...props}
    />
  );
}
