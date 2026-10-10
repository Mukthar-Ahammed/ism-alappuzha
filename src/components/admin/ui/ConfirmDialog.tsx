"use client";

import type { DialogHTMLAttributes } from "react";
import { Button } from "@/components/admin/ui/Button";
import { cn } from "@/lib/utils/cn";

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  className,
  ...props
}: DialogHTMLAttributes<HTMLDialogElement> & {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}) {
  return (
    <dialog
      className={cn(
        "w-[min(28rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-border-subtle bg-bg p-0 text-text-main shadow-floating backdrop:bg-primary/40",
        className
      )}
      {...props}
    >
      <form method="dialog" className="space-y-5 p-5">
        <div>
          <h2 className="text-lg font-bold text-primary">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="submit" variant="secondary">
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
