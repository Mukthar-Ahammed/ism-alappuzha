"use client";

import { useActionState } from "react";
import { Button, FormField, Input } from "@/components/admin/ui";
import { changeOwnPasswordAction } from "@/features/team/server/actions";
import type { TeamActionState } from "@/features/team/types";

const initialState: TeamActionState = { ok: false };

export function ChangeOwnPasswordForm() {
  const [state, formAction, pending] = useActionState(
    changeOwnPasswordAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="New password" htmlFor="own-password">
          <Input
            id="own-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </FormField>
        <FormField label="Confirm password" htmlFor="own-confirm-password">
          <Input
            id="own-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Changing..." : "Change password"}
      </Button>
      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          {state.message}
        </p>
      )}
    </form>
  );
}
