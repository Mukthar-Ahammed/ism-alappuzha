"use client";

import { useActionState } from "react";
import { Button } from "@/components/admin/ui";
import { importLeadersAction } from "@/features/leaders/server/actions";
import type { LeaderActionState } from "@/features/leaders/types";
import { ActionMessage } from "@/components/admin/ActionMessage";

export function ImportLeadersButton() {
  const [state, formAction, pending] = useActionState<LeaderActionState, FormData>(
    importLeadersAction,
    null
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Importing…" : "Import current leaders as drafts"}
      </Button>
      <ActionMessage state={state} />
    </form>
  );
}
