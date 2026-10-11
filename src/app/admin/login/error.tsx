"use client";

import { useEffect } from "react";

export default function Error({ error }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin sign-in]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-primary-tint px-6 py-10">
      <p className="text-primary">Sign in is unavailable.</p>
      {/* A full reload picks up the latest deploy; a page opened before a deploy cannot sign in. */}
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary"
      >
        Try again
      </button>
      {error.digest && (
        <p className="mt-4 text-xs text-text-muted">Reference: {error.digest}</p>
      )}
    </main>
  );
}
