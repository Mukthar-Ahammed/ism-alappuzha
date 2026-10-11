"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { Button } from "@/components/admin/ui";
import { leaderRowAction } from "@/features/leaders/server/actions";
import type { LeaderActionState, LeaderStatus } from "@/features/leaders/types";
import { ActionMessage } from "@/components/admin/ActionMessage";

export function LeaderRowActions({
  id,
  name,
  status,
  isFirst,
  isLast,
}: {
  id: string;
  name: string;
  status: LeaderStatus;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [state, formAction, pending] = useActionState<LeaderActionState, FormData>(
    leaderRowAction,
    null
  );
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <Button
          type="submit"
          name="intent"
          value="up"
          variant="secondary"
          disabled={pending || isFirst}
          aria-label={`Move ${name} up`}
        >
          ↑
        </Button>
        <Button
          type="submit"
          name="intent"
          value="down"
          variant="secondary"
          disabled={pending || isLast}
          aria-label={`Move ${name} down`}
        >
          ↓
        </Button>
        <Link
          href={`/admin/leaders/${id}`}
          className="inline-flex min-h-10 items-center rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          Edit
        </Link>
        <Button
          type="submit"
          name="intent"
          value={status === "published" ? "unpublish" : "publish"}
          variant={status === "published" ? "secondary" : "primary"}
          disabled={pending}
        >
          {status === "published" ? "Unpublish" : "Publish"}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={pending}
          onClick={() => dialogRef.current?.showModal()}
        >
          Delete
        </Button>
      </form>
      <ActionMessage state={state} />

      <dialog
        ref={dialogRef}
        aria-labelledby={`delete-leader-${id}`}
        className="w-[min(28rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-border-subtle bg-bg p-0 text-text-main shadow-floating backdrop:bg-primary/40"
      >
        <form
          action={(formData) => {
            dialogRef.current?.close();
            formAction(formData);
          }}
          className="space-y-5 p-5"
        >
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="intent" value="delete" />
          <div>
            <h2 id={`delete-leader-${id}`} className="text-lg font-bold text-primary">
              Delete {name}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              This removes the leader and their photo files. It cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Delete leader
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
