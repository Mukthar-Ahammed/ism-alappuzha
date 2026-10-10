import React from "react";
import { cn } from "@/lib/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "accent" | "brass" | "outline" | "surface" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "accent", size = "md", children, className, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-body font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-none tracking-wide";

    const variantStyles: Record<string, string> = {
      accent:
        "bg-accent text-background hover:bg-accent/90 shadow-lg shadow-accent/10 hover:shadow-accent/20",
      brass:
        "bg-accent text-background hover:bg-accent/90 shadow-lg shadow-accent/10 hover:shadow-accent/20",
      outline:
        "border border-accent/50 text-foreground hover:border-accent hover:bg-accent/10",
      surface:
        "bg-surface text-foreground hover:bg-surface/80 border border-accent/20",
      ghost:
        "text-foreground/80 hover:text-foreground hover:bg-white/5",
    };

    const sizeStyles = {
      sm: "px-4 py-2 text-xs",
      md: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
