"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { Button } from "@/components/admin/ui";
import { ActionMessage } from "@/components/admin/ActionMessage";
import { parseLiveLink } from "@/lib/live-links";
import { programRowAction } from "@/features/programs/server/actions";
import type { ProgramActionState } from "@/features/programs/types";

const linkClass =
  "inline-flex min-h-10 items-center rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary";

export function ProgramRowActions({
  id,
  title,
  speaker,
  link,
  cancelled,
}: {
  id: string;
  title: string;
  speaker: string;
  link: string | null;
  cancelled: boolean;
}) {
  const [state, formAction, pending] = useActionState<ProgramActionState, FormData>(
    programRowAction,
    null
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  // A stream link on the program is carried over when it is one the live screen accepts.
  const streamLink = link && parseLiveLink(link).ok ? link : "";
  const liveHref = `/admin/live?${new URLSearchParams({ title, speaker, link: streamLink }).toString()}`;

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <Link href={`/admin/programs/${id}`} className={linkClass}>
          Edit
        </Link>
        <Button type="submit" name="intent" value="duplicate" variant="secondary" disabled={pending}>
          Duplicate
        </Button>
        {!cancelled && (
          <>
            <Link href={liveHref} className={linkClass}>
              Use for live broadcast
            </Link>
            <Button
              type="button"
              variant="danger"
              disabled={pending}
              onClick={() => dialogRef.current?.showModal()}
            >
              Cancel program
            </Button>
          </>
        )}
      </form>
      <ActionMessage state={state} />

      <dialog
        ref={dialogRef}
        aria-labelledby={`cancel-program-${id}`}
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
          <input type="hidden" name="intent" value="cancel" />
          <div>
            <h2 id={`cancel-program-${id}`} className="text-lg font-bold text-primary">
              Cancel {title}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              It is removed from the homepage straight away. You can still edit or duplicate it.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => dialogRef.current?.close()}>
              Keep program
            </Button>
            <Button type="submit" variant="danger">
              Cancel program
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
