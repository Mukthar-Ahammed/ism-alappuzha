"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen bg-primary-tint px-6 py-10">
      <p className="text-primary">Verification is unavailable.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary"
      >
        Try again
      </button>
    </main>
  );
}
