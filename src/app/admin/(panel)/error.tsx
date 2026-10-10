"use client";

import { Button } from "@/components/admin/ui";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[var(--radius-card)] border border-border-subtle bg-bg p-6 shadow-soft">
        <h1 className="font-display text-2xl font-semibold text-primary">
          Admin panel unavailable
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Something went wrong while loading this admin screen.
        </p>
        <Button type="button" className="mt-5" onClick={reset}>
          Retry
        </Button>
      </div>
    </main>
  );
}
