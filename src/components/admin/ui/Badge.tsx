import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeTone = "neutral" | "gold" | "green" | "red";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-primary-tint text-primary",
  gold: "bg-secondary-tint text-secondary",
  green: "bg-emerald-50 text-emerald-800",
  red: "bg-red-50 text-red-800",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
