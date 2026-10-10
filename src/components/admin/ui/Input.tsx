import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-10 w-full rounded-xl border border-border-subtle bg-bg px-3 py-2 text-sm text-primary outline-none transition placeholder:text-text-muted/60 focus:border-secondary focus:ring-2 focus:ring-secondary/30 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}
