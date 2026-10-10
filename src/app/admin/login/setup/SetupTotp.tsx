"use client";

import { useActionState, useState, useTransition } from "react";
import {
  beginTotpSetupAction,
  confirmSetupAction,
  type LoginState,
  type SetupFactor,
} from "@/app/admin/auth-actions";

const initialState: LoginState = {};

export function SetupTotp({ next }: { next: string }) {
  const [factor, setFactor] = useState<SetupFactor | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [state, formAction, verifying] = useActionState(
    confirmSetupAction,
    initialState
  );

  function beginSetup() {
    setSetupError(null);
    startTransition(async () => {
      const result = await beginTotpSetupAction();

      if (result.ok) {
        setFactor(result.data);
      } else {
        setSetupError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {!factor && (
        <button
          type="button"
          onClick={beginSetup}
          disabled={isPending}
          className="w-full rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-secondary-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {isPending ? "Creating setup..." : "Create authenticator setup"}
        </button>
      )}

      {setupError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {setupError}
        </p>
      )}

      {factor && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border-subtle bg-primary-tint p-4">
            <div
              className="mx-auto w-fit rounded-xl bg-white p-3"
              dangerouslySetInnerHTML={{ __html: factor.qrSvg }}
            />
          </div>
          <div>
            <label
              htmlFor="setup-key"
              className="block text-sm font-semibold text-primary"
            >
              Text setup key
            </label>
            <input
              id="setup-key"
              readOnly
              value={factor.secret}
              className="mt-2 w-full rounded-xl border border-border-subtle px-4 py-3 font-mono text-sm text-primary"
            />
          </div>
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="factorId" value={factor.factorId} />
            <input type="hidden" name="next" value={next} />
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-semibold text-primary"
              >
                First 6-digit code
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
              disabled={verifying}
              className="w-full rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-secondary-hover disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {verifying ? "Confirming..." : "Confirm authenticator"}
            </button>
          </form>
          <button
            type="button"
            onClick={beginSetup}
            disabled={isPending}
            className="w-full rounded-full border border-border-subtle px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary-tint disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            Retry setup
          </button>
        </div>
      )}
    </div>
  );
}
