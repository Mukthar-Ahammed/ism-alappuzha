"use client";

import { useActionState } from "react";
import { verifyTotpAction, type LoginState } from "@/app/admin/auth-actions";

const initialState: LoginState = {};

export function VerifyForm({
  factorId,
  next,
}: {
  factorId: string;
  next: string;
}) {
  const [state, formAction, pending] = useActionState(
    verifyTotpAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="factorId" value={factorId} />
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="code" className="block text-sm font-semibold text-primary">
          Authenticator code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          autoFocus
          required
          className="mt-2 w-full rounded-xl border border-border-subtle px-4 py-3 text-center font-mono text-lg tracking-[0.35em] text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
        />
      </div>
      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-secondary-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {pending ? "Verifying..." : "Verify"}
      </button>
    </form>
  );
}
