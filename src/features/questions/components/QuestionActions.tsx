"use client";

import { useRef, useState } from "react";
import { Button, FormField, Input, Select, Textarea } from "@/components/admin/ui";
import {
  archive,
  deleteQuestion,
  publish,
  restore,
  unpublish,
} from "@/features/questions/server/actions";
import { canPublishQuestion } from "@/features/questions/workflow";
import type { QuestionRow } from "@/features/questions/types";

export function PublishQuestionDialog({ question }: { question: QuestionRow }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [publicQuestion, setPublicQuestion] = useState(
    question.public_question ?? question.question
  );
  const canPublish = canPublishQuestion(question);

  if (question.status !== "answered") {
    return null;
  }

  return (
    <div className="space-y-3">
      {question.is_published ? (
        <form action={unpublish}>
          <BaseHidden question={question} />
          <Button type="submit" variant="secondary" className="w-full">
            Unpublish
          </Button>
        </form>
      ) : (
        <>
          <Button
            type="button"
            className="w-full"
            disabled={!canPublish}
            onClick={() => dialogRef.current?.showModal()}
          >
            Publish
          </Button>
          {!canPublish && question.is_private && (
            <p className="text-sm font-semibold text-red-700">
              Private questions cannot be published.
            </p>
          )}
        </>
      )}

      <dialog
        ref={dialogRef}
        className="w-[min(34rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-border-subtle bg-bg p-0 text-text-main shadow-floating backdrop:bg-primary/40"
      >
        <form action={publish} className="space-y-5 p-5">
          <BaseHidden question={question} />
          <div>
            <h2 className="text-lg font-bold text-primary">Publish question</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              Edit the public wording separately from the original question.
            </p>
          </div>
          <FormField label="Public question" htmlFor="public-question">
            <Textarea
              id="public-question"
              name="publicQuestion"
              value={publicQuestion}
              onChange={(event) => setPublicQuestion(event.target.value)}
              className="min-h-36 font-malayalam"
              dir="auto"
            />
          </FormField>
          <div className="rounded-xl border border-border-subtle bg-primary-tint p-3">
            <p className="text-xs font-bold uppercase text-text-muted">
              Answer preview
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-primary">
              {question.answer}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
            <Button type="submit">Publish</Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

export function ArchiveRestoreDeleteActions({
  question,
}: {
  question: QuestionRow;
}) {
  return (
    <div className="space-y-3">
      {question.status === "archived" ? (
        <form action={restore}>
          <BaseHidden question={question} />
          <Button type="submit" variant="secondary" className="w-full">
            Restore to pending
          </Button>
        </form>
      ) : (
        <form action={archive} className="space-y-3">
          <BaseHidden question={question} />
          <FormField label="Archive reason" htmlFor="archive-reason">
            <Select id="archive-reason" name="reason" defaultValue="Spam">
              <option value="Spam">Spam</option>
              <option value="Duplicate">Duplicate</option>
              <option value="Out of scope">Out of scope</option>
            </Select>
          </FormField>
          <Button type="submit" variant="secondary" className="w-full">
            Archive
          </Button>
        </form>
      )}

      <form action={deleteQuestion} className="space-y-3">
        <BaseHidden question={question} />
        <FormField label="Type DELETE to permanently remove" htmlFor="delete-confirm">
          <Input id="delete-confirm" name="confirm" autoComplete="off" />
        </FormField>
        <Button type="submit" variant="danger" className="w-full">
          Delete question
        </Button>
      </form>
    </div>
  );
}

function BaseHidden({ question }: { question: QuestionRow }) {
  return (
    <>
      <input type="hidden" name="id" value={question.id} />
      <input type="hidden" name="updatedAt" value={question.updated_at} />
    </>
  );
}
