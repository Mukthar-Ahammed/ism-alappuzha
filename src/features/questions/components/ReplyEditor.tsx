"use client";

import { useActionState, useEffect, useState } from "react";
import { Button, FormField, Textarea } from "@/components/admin/ui";
import {
  saveDraft,
  sendCorrection,
  sendReply,
} from "@/features/questions/server/actions";
import { lineBreakText } from "@/features/questions/format";
import type { QuestionActionState, QuestionRow } from "@/features/questions/types";

const initialState: QuestionActionState = {};

export function ReplyEditor({ question }: { question: QuestionRow }) {
  const initialReply = question.draft_answer ?? question.answer ?? "";
  const [reply, setReply] = useState(initialReply);
  const [draftState, draftAction, draftPending] = useActionState(
    saveDraft,
    initialState
  );
  const [replyState, replyAction, replyPending] = useActionState(
    sendReply,
    initialState
  );
  const [correctionState, correctionAction, correctionPending] = useActionState(
    sendCorrection,
    initialState
  );
  const dirty = reply !== initialReply;

  useEffect(() => {
    if (!dirty) return;

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const latestState = correctionState.message || correctionState.error
    ? correctionState
    : replyState.message || replyState.error
      ? replyState
      : draftState;

  return (
    <section className="space-y-4">
      <FormField label="Reply" htmlFor="reply">
        <Textarea
          id="reply"
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          className="min-h-64 font-malayalam text-base leading-7"
          dir="auto"
        />
      </FormField>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-muted">
        <span>{reply.length} characters</span>
        {dirty && <span>Unsaved changes</span>}
      </div>

      {latestState.message && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {latestState.message}
        </p>
      )}
      {latestState.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {latestState.error}
        </p>
      )}

      <div className="rounded-xl border border-border-subtle bg-primary-tint p-4">
        <h2 className="text-sm font-bold text-primary">Live preview</h2>
        <div className="mt-3 space-y-2 whitespace-pre-wrap font-malayalam text-sm leading-7 text-text-main">
          {reply ? (
            lineBreakText(reply).map((line, index) => (
              <p key={`${index}-${line}`} dir="auto" className="empty:min-h-4">
                {line}
              </p>
            ))
          ) : (
            <p className="text-text-muted">Reply preview appears here.</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ReplyActionForm
          action={draftAction}
          pending={draftPending}
          question={question}
          reply={reply}
          label="Save draft"
        />
        <ReplyActionForm
          action={replyAction}
          pending={replyPending}
          question={question}
          reply={reply}
          label={question.email ? "Send reply" : "Send reply"}
        />
        <ReplyActionForm
          action={correctionAction}
          pending={correctionPending}
          question={question}
          reply={reply}
          label="Send correction"
          disabled={question.status !== "answered"}
        />
      </div>
    </section>
  );
}

function ReplyActionForm({
  action,
  pending,
  question,
  reply,
  label,
  disabled = false,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  question: QuestionRow;
  reply: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={question.id} />
      <input type="hidden" name="updatedAt" value={question.updated_at} />
      <input type="hidden" name="answer" value={reply} />
      <Button type="submit" className="w-full" disabled={pending || disabled}>
        {pending ? "Saving..." : label}
      </Button>
    </form>
  );
}
