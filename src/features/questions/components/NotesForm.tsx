"use client";

import { useActionState } from "react";
import { Button, FormField, Textarea } from "@/components/admin/ui";
import { saveNotes } from "@/features/questions/server/actions";
import type { QuestionActionState, QuestionRow } from "@/features/questions/types";

const initialState: QuestionActionState = {};

export function NotesForm({ question }: { question: QuestionRow }) {
  const [state, action, pending] = useActionState(saveNotes, initialState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={question.id} />
      <input type="hidden" name="updatedAt" value={question.updated_at} />
      <FormField label="Internal notes" htmlFor="internal-notes">
        <Textarea
          id="internal-notes"
          name="notes"
          defaultValue={question.internal_notes ?? ""}
          className="min-h-36"
        />
      </FormField>
      {state.message && (
        <p className="text-sm font-semibold text-emerald-800">{state.message}</p>
      )}
      {state.error && (
        <p className="text-sm font-semibold text-red-700">{state.error}</p>
      )}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving..." : "Save notes"}
      </Button>
    </form>
  );
}
