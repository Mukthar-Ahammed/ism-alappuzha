import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-secondary text-primary hover:bg-secondary-hover",
  secondary: "border border-border-subtle bg-bg text-primary hover:bg-primary-tint",
  ghost: "text-primary hover:bg-primary-tint",
  danger: "border border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
