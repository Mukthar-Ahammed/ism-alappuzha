"use client";

import { Button } from "@/components/admin/ui";

export default function ProgramEditError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border-subtle bg-bg p-6 shadow-soft">
      <h1 className="font-display text-2xl font-semibold text-primary">
        Program editor unavailable
      </h1>
      <p className="mt-2 text-sm leading-6 text-text-muted">
        Could not load this program. Please refresh the page or try again.
      </p>
      <Button type="button" className="mt-5" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
