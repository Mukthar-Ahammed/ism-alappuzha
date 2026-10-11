"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { Button, Card, CardContent, FormField, Input, Skeleton, Textarea } from "@/components/admin/ui";
import { ActionMessage } from "@/components/admin/ActionMessage";
import type { ImageFieldValue } from "@/components/admin/ImageUploadField";
import { IssueCover } from "@/components/ui/IssueCover";
import { PdfModal } from "@/components/ui/PdfModal";
import type { StoredPdf } from "@/features/media/types";
import { saveIssueAction } from "@/features/issues/server/actions";
import type { AdminIssue, IssueActionState } from "@/features/issues/types";
import { issueMonthYear } from "@/features/issues/workflow";

// Upload fields load only when the editor opens.
const ImageUploadField = dynamic(() => import("@/components/admin/ImageUploadField"), {
  ssr: false,
  loading: () => <Skeleton className="h-40 w-full" />,
});
const PdfUploadField = dynamic(() => import("@/components/admin/PdfUploadField"), {
  ssr: false,
  loading: () => <Skeleton className="h-28 w-full" />,
});

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function IssueEditor({ issue }: { issue: AdminIssue | null }) {
  const [state, formAction, pending] = useActionState<IssueActionState, FormData>(
    saveIssueAction,
    null
  );
  const [title, setTitle] = useState(issue?.title ?? "");
  const [issueDate, setIssueDate] = useState(issue?.issueDate ?? "");
  const [description, setDescription] = useState(issue?.description ?? "");
  const [cover, setCover] = useState<ImageFieldValue>({
    media: issue?.cover ?? null,
    alt: issue?.cover?.alt ?? "",
  });
  const [pdf, setPdf] = useState<StoredPdf | null>(issue?.pdf ?? null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const monthYear = datePattern.test(issueDate)
    ? issueMonthYear(issueDate)
    : { month: "Month", year: new Date().getFullYear() };
  const previewIssue = {
    id: issue?.id ?? "preview",
    title: title || "Issue title",
    ...monthYear,
    summary: description,
    coverImage: cover.media?.url,
    coverBlurDataUrl: cover.media?.blurDataUrl,
    coverAlt: cover.alt || undefined,
    pdfUrl: pdf?.url ?? "",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <Card>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={issue?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <FormField label="Title" htmlFor="issue-title">
                <Input
                  id="issue-title"
                  name="title"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </FormField>
              <FormField label="Issue date" htmlFor="issue-date">
                <Input
                  id="issue-date"
                  name="issueDate"
                  type="date"
                  required
                  value={issueDate}
                  onChange={(event) => setIssueDate(event.target.value)}
                />
              </FormField>
            </div>
            <FormField label="Short description" htmlFor="issue-description">
              <Textarea
                id="issue-description"
                name="description"
                maxLength={500}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </FormField>
            <FormField label="Title (Malayalam, optional)" htmlFor="issue-title-ml">
              <Input
                id="issue-title-ml"
                name="titleMl"
                lang="ml"
                maxLength={200}
                className="admin-malayalam"
                defaultValue={issue?.titleMl ?? ""}
              />
            </FormField>
            <FormField label="Short description (Malayalam, optional)" htmlFor="issue-description-ml">
              <Textarea
                id="issue-description-ml"
                name="descriptionMl"
                lang="ml"
                maxLength={500}
                className="admin-malayalam"
                defaultValue={issue?.descriptionMl ?? ""}
              />
            </FormField>
            <p className="-mt-2 text-xs text-text-muted">
              The Malayalam fields are shown when a visitor switches the site to Malayalam; empty ones fall back to the English.
            </p>

            <ImageUploadField
              purpose="issue_cover"
              mediaInputName="coverMediaId"
              altInputName="coverAlt"
              initial={cover}
              onChange={setCover}
            />
            <PdfUploadField
              pathInputName="pdfPath"
              bytesInputName="pdfBytes"
              initial={pdf}
              onChange={setPdf}
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : issue ? "Save changes" : "Save as draft"}
              </Button>
              <ActionMessage state={state} />
            </div>
          </form>
        </CardContent>
      </Card>

      <aside aria-label="Preview" className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Preview</p>
        <IssueCover issue={previewIssue} onClick={pdf ? () => setPreviewOpen(true) : undefined} />
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={!pdf}
          onClick={() => setPreviewOpen(true)}
        >
          {pdf ? "Open the reader as visitors see it" : "Upload a PDF to preview the reader"}
        </Button>
      </aside>

      {previewOpen && pdf && (
        <PdfModal
          isOpen
          onClose={() => setPreviewOpen(false)}
          pdfUrl={pdf.url}
          title={`${previewIssue.title} (${previewIssue.month} ${previewIssue.year})`}
        />
      )}
    </div>
  );
}
