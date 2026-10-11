"use client";

import { useId, useState } from "react";
import { finalizePdfUploadAction, requestPdfUploadAction } from "@/features/media/server/actions";
import type { StoredPdf } from "@/features/media/types";
import { hasPdfHeader, maxPdfBytes } from "@/lib/pdf/check";
import { formatBytes, putWithProgress } from "@/components/admin/upload-client";

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; progress: number }
  | { phase: "checking" }
  | { phase: "error"; message: string };

/** Quick browser-side check; the server repeats it on the full file. */
async function precheck(file: File): Promise<string | null> {
  if (file.size > maxPdfBytes) {
    return "PDFs must be 25 MB or smaller.";
  }

  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());

  return hasPdfHeader(head) ? null : "Choose a PDF file.";
}

export default function PdfUploadField({
  pathInputName,
  bytesInputName,
  initial,
  onChange,
}: {
  pathInputName: string;
  bytesInputName: string;
  initial: StoredPdf | null;
  onChange?: (pdf: StoredPdf | null) => void;
}) {
  const inputId = useId();
  const [pdf, setPdf] = useState<StoredPdf | null>(initial);
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const busy = state.phase === "uploading" || state.phase === "checking";

  async function handleFile(file: File) {
    const problem = await precheck(file);

    if (problem) {
      setState({ phase: "error", message: problem });
      return;
    }

    const issued = await requestPdfUploadAction({ size: file.size });

    if (!issued.ok) {
      setState({ phase: "error", message: issued.error });
      return;
    }

    setState({ phase: "uploading", progress: 0 });
    const uploaded = await putWithProgress(issued.data.signedUrl, file, (progress) =>
      setState({ phase: "uploading", progress })
    );

    if (!uploaded) {
      setState({ phase: "error", message: "The upload did not finish. Check your connection and try again." });
      return;
    }

    setState({ phase: "checking" });
    const finalized = await finalizePdfUploadAction({ uploadPath: issued.data.uploadPath });

    if (!finalized.ok) {
      setState({ phase: "error", message: finalized.error });
      return;
    }

    setState({ phase: "idle" });
    setPdf(finalized.data);
    onChange?.(finalized.data);
  }

  return (
    <fieldset className="space-y-3 rounded-xl border border-border-subtle p-4">
      <legend className="px-1 text-sm font-semibold text-primary">Issue PDF</legend>
      <p className="text-xs leading-5 text-text-muted">PDF only, up to 25 MB. Visitors read it online or download it.</p>

      <input type="hidden" name={pathInputName} value={pdf?.path ?? ""} />
      <input type="hidden" name={bytesInputName} value={pdf?.bytes ?? ""} />

      {pdf && (
        <p className="text-sm text-text-muted">
          Uploaded PDF, {formatBytes(pdf.bytes)}.{" "}
          <a
            href={pdf.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline underline-offset-4"
          >
            Open PDF
          </a>
        </p>
      )}

      <label
        htmlFor={inputId}
        className="inline-flex min-h-10 cursor-pointer items-center rounded-full border border-border-subtle px-4 py-2 text-sm font-semibold text-primary focus-within:ring-2 focus-within:ring-secondary hover:bg-primary-tint"
      >
        {pdf ? "Replace PDF" : "Choose PDF"}
        <input
          id={inputId}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";

            if (file) {
              void handleFile(file);
            }
          }}
        />
      </label>

      {state.phase === "uploading" && (
        <div className="space-y-1">
          <progress
            max={100}
            value={state.progress}
            aria-label="PDF upload progress"
            className="h-2 w-full overflow-hidden rounded-full accent-secondary"
          />
          <p className="text-xs text-text-muted" aria-live="polite">
            Uploading… {state.progress}%
          </p>
        </div>
      )}
      {state.phase === "checking" && (
        <p className="text-xs text-text-muted" aria-live="polite">
          Checking the PDF…
        </p>
      )}
      {state.phase === "error" && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
          {state.message}
        </p>
      )}
    </fieldset>
  );
}
