"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-bg px-6 py-10">
      <h1 className="font-display text-2xl text-primary">Admin unavailable</h1>
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
