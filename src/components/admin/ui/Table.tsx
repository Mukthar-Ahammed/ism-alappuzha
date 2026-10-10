import type { TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Table({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle">
      <table
        className={cn(
          "hidden w-full border-collapse text-left text-sm md:table",
          className
        )}
        {...props}
      />
    </div>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b border-border-subtle bg-primary-tint px-4 py-3 text-xs font-bold uppercase tracking-wide text-text-muted",
        className
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("border-b border-border-subtle px-4 py-3 text-primary", className)}
      {...props}
    />
  );
}

export function MobileTableCards({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-3 md:hidden", className)} {...props} />;
}
