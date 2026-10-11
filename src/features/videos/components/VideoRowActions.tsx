"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { Button } from "@/components/admin/ui";
import { ActionMessage } from "@/components/admin/ActionMessage";
import { videoRowAction } from "@/features/videos/server/actions";
import type { VideoActionState } from "@/features/videos/types";

export function VideoRowActions({
  id,
  title,
  published,
}: {
  id: string;
  title: string;
  published: boolean;
}) {
  const [state, formAction, pending] = useActionState<VideoActionState, FormData>(
    videoRowAction,
    null
  );
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <Link
          href={`/admin/videos/${id}`}
          className="inline-flex min-h-10 items-center rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          Edit
        </Link>
        <Button
          type="submit"
          name="intent"
          value={published ? "unpublish" : "publish"}
          variant={published ? "secondary" : "primary"}
          disabled={pending}
        >
          {published ? "Unpublish" : "Publish"}
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
        aria-labelledby={`delete-video-${id}`}
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
            <h2 id={`delete-video-${id}`} className="text-lg font-bold text-primary">
              Delete {title}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              This removes the video from the website and deletes its uploaded thumbnail. The
              video itself stays on its platform.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Delete video
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
