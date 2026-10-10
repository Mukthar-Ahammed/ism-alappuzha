"use client";

import { useActionState } from "react";
import { signInAction, type LoginState } from "@/app/admin/auth-actions";

const initialState: LoginState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-primary">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 w-full rounded-xl border border-border-subtle px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-primary"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-xl border border-border-subtle px-4 py-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-secondary"
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
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
