"use server";

import { randomUUID } from "node:crypto";
import { requireAdminAction } from "@/lib/auth/guard";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import type { ImagePipelineError } from "@/lib/images/pipeline";
import {
  immutableCacheControl,
  issuePdfsBucket,
  publicPdfUrl,
  uploadsTmpBucket,
} from "@/lib/images/storage";
import { checkPdf, type PdfCheckError } from "@/lib/pdf/check";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  finalizePdfUploadSchema,
  finalizeUploadSchema,
  isOwnTemporaryUpload,
  requestPdfUploadSchema,
  requestUploadSchema,
  temporaryUploadPath,
} from "@/features/media/schemas";
import { storeImage } from "@/features/media/server/store";
import type {
  FinalizePdfResult,
  FinalizeUploadResult,
  IssueUploadResult,
} from "@/features/media/types";

const uploadsPerHour = 30;
const genericUploadError = "Could not upload this image. Please try again.";
const genericPdfError = "Could not upload this PDF. Please try again.";

const pdfErrors: Record<PdfCheckError, string> = {
  too_large: "PDFs must be 25 MB or smaller.",
  empty: "This file is empty.",
  not_pdf: "This file is not a complete PDF. Export it again as PDF and retry.",
};

const pipelineErrors: Record<ImagePipelineError, string> = {
  too_large: "Images must be 8 MB or smaller.",
  unsupported_type: "This file is not a JPG, PNG or WebP image.",
  unreadable: "This image could not be read. Try exporting it again as JPG.",
  too_small: "This image is too small. Use a larger photo.",
};

export async function requestImageUploadAction(input: unknown): Promise<IssueUploadResult> {
  const parsed = requestUploadSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? genericUploadError };
  }

  return issueTemporaryUpload(genericUploadError);
}

/** Guarded, rate-limited, single-use signed URL into the private uploads-tmp bucket. */
async function issueTemporaryUpload(failureMessage: string): Promise<IssueUploadResult> {
  const guard = await requireAdminAction({ roles: ["admin"] });

  if (!guard.ok) {
    return guard;
  }

  const allowed = await checkRateLimit(
    `admin:upload:${guard.data.user.id}`,
    uploadsPerHour,
    60 * 60
  );

  if (!allowed) {
    return { ok: false, error: "Too many uploads. Please wait a while and try again." };
  }

  const supabase = createSupabaseAdminClient();
  const uploadPath = temporaryUploadPath(guard.data.user.id, randomUUID());
  // upsert stays off, so the URL cannot overwrite a file once it has been used.
  const signed = await supabase.storage
    .from(uploadsTmpBucket)
    .createSignedUploadUrl(uploadPath, { upsert: false });

  if (signed.error) {
    console.error("[media] could not issue upload URL:", signed.error.name);
    return { ok: false, error: failureMessage };
  }

  return { ok: true, data: { uploadPath, signedUrl: signed.data.signedUrl } };
}

export async function requestPdfUploadAction(input: unknown): Promise<IssueUploadResult> {
  const parsed = requestPdfUploadSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? genericPdfError };
  }

  return issueTemporaryUpload(genericPdfError);
}

export async function finalizePdfUploadAction(input: unknown): Promise<FinalizePdfResult> {
  const parsed = finalizePdfUploadSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: genericPdfError };
  }

  const guard = await requireAdminAction({ roles: ["admin"] });

  if (!guard.ok) {
    return guard;
  }

  if (!isOwnTemporaryUpload(guard.data.user.id, parsed.data.uploadPath)) {
    return { ok: false, error: genericPdfError };
  }

  const supabase = createSupabaseAdminClient();
  const tmp = supabase.storage.from(uploadsTmpBucket);

  try {
    const downloaded = await tmp.download(parsed.data.uploadPath);

    if (downloaded.error) {
      return { ok: false, error: genericPdfError };
    }

    const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
    const problem = checkPdf(bytes);

    if (problem) {
      return { ok: false, error: pdfErrors[problem] };
    }

    const path = `issues/${randomUUID()}.pdf`;
    const stored = await supabase.storage.from(issuePdfsBucket).upload(path, bytes, {
      contentType: "application/pdf",
      // Random names are never reused, so the file can be cached forever.
      cacheControl: immutableCacheControl,
      upsert: false,
    });

    if (stored.error) {
      return { ok: false, error: genericPdfError };
    }

    return { ok: true, data: { path, url: publicPdfUrl(path), bytes: bytes.length } };
  } finally {
    // The upload is never kept in the temporary bucket, whatever happened above.
    await tmp.remove([parsed.data.uploadPath]);
  }
}

export async function finalizeImageUploadAction(input: unknown): Promise<FinalizeUploadResult> {
  const parsed = finalizeUploadSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: genericUploadError };
  }

  const guard = await requireAdminAction({ roles: ["admin"] });

  if (!guard.ok) {
    return guard;
  }

  if (!isOwnTemporaryUpload(guard.data.user.id, parsed.data.uploadPath)) {
    return { ok: false, error: genericUploadError };
  }

  const supabase = createSupabaseAdminClient();
  const tmp = supabase.storage.from(uploadsTmpBucket);

  try {
    const downloaded = await tmp.download(parsed.data.uploadPath);

    if (downloaded.error) {
      return { ok: false, error: genericUploadError };
    }

    const stored = await storeImage(
      Buffer.from(await downloaded.data.arrayBuffer()),
      parsed.data.purpose,
      guard.data.user.email ?? "unknown"
    );

    if (!stored.ok) {
      return {
        ok: false,
        error: stored.error === "storage" ? genericUploadError : pipelineErrors[stored.error],
      };
    }

    return stored;
  } finally {
    // The original is never kept, whatever happened above.
    await tmp.remove([parsed.data.uploadPath]);
  }
}
