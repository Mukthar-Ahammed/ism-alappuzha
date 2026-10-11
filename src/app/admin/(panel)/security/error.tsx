"use client";

import { Button } from "@/components/admin/ui";

export default function SecurityError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-4xl rounded-[var(--radius-card)] border border-border-subtle bg-bg p-6 shadow-soft">
      <h1 className="font-display text-2xl font-semibold text-primary">
        Security settings unavailable
      </h1>
      <p className="mt-2 text-sm leading-6 text-text-muted">
        Could not load security devices or credentials. Please check your session
        and try again.
      </p>
      <Button type="button" className="mt-5" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
