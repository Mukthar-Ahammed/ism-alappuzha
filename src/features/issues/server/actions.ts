"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminActor } from "@/lib/auth/guard";
import { issuePdfsBucket } from "@/lib/images/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { jsonField } from "@/lib/utils/json";
import {
  parseReleasedMedia,
  removeReleasedMediaFiles,
} from "@/features/media/server/data";
import { issueFormSchema, issueRowActionSchema } from "@/features/issues/schemas";
import { issuesCacheTag, type IssueActionState } from "@/features/issues/types";
import { issueErrorMessage } from "@/features/issues/workflow";

function revalidateIssues(): void {
  // Expire immediately so the homepage shows the change on the next visit.
  updateTag(issuesCacheTag);
  revalidatePath("/admin/issues", "layout");
}

/** Deletes a PDF the database no longer references (replaced or deleted issue). */
async function removeReleasedPdf(value: unknown): Promise<void> {
  if (typeof value !== "string" || value === "") {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(issuePdfsBucket).remove([value]);

  if (error) {
    // The row no longer points at it; a leftover file only costs storage.
    console.error("[issues] could not remove a released PDF:", error.name);
  }
}

export async function saveIssueAction(
  _state: IssueActionState,
  formData: FormData
): Promise<IssueActionState> {
  const parsed = issueFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const guard = await requireAdminActor({ roles: ["admin"] });

  if (!guard.ok) {
    return guard;
  }

  const input = parsed.data;
  const supabase = createSupabaseAdminClient();
  const saved = await supabase.rpc("admin_save_issue", {
    p_id: input.id,
    p_title: input.title,
    p_issue_date: input.issueDate,
    p_description: input.description,
    p_cover_media_id: input.coverMediaId,
    p_cover_alt: input.coverAlt,
    p_pdf_path: input.pdfPath,
    p_pdf_bytes: input.pdfBytes,
    p_title_ml: input.titleMl,
    p_description_ml: input.descriptionMl,
    p_actor_email: guard.actor,
  });

  if (saved.error) {
    return { ok: false, error: issueErrorMessage(saved.error.message) };
  }

  await Promise.all([
    removeReleasedMediaFiles(parseReleasedMedia(jsonField(saved.data, "released"))),
    removeReleasedPdf(jsonField(saved.data, "released_pdf")),
  ]);
  revalidateIssues();

  const savedId = jsonField(saved.data, "id");

  if (!input.id && typeof savedId === "string") {
    redirect(`/admin/issues/${savedId}?created=1`);
  }

  return { ok: true, data: { message: "Issue saved." } };
}

export async function issueRowAction(
  _state: IssueActionState,
  formData: FormData
): Promise<IssueActionState> {
  const parsed = issueRowActionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: issueErrorMessage(undefined) };
  }

  const guard = await requireAdminActor({ roles: ["admin"] });

  if (!guard.ok) {
    return guard;
  }

  const supabase = createSupabaseAdminClient();
  const { id, intent } = parsed.data;

  if (intent === "delete") {
    const deleted = await supabase.rpc("admin_delete_issue", {
      p_id: id,
      p_actor_email: guard.actor,
    });

    if (deleted.error) {
      return { ok: false, error: issueErrorMessage(deleted.error.message) };
    }

    await Promise.all([
      removeReleasedMediaFiles(parseReleasedMedia(jsonField(deleted.data, "released"))),
      removeReleasedPdf(jsonField(deleted.data, "released_pdf")),
    ]);
    revalidateIssues();
    return { ok: true, data: { message: "Issue deleted with its cover and PDF." } };
  }

  if (intent === "feature") {
    const featured = await supabase.rpc("admin_feature_issue", {
      p_id: id,
      p_actor_email: guard.actor,
    });

    if (featured.error) {
      return { ok: false, error: issueErrorMessage(featured.error.message) };
    }

    revalidateIssues();
    return { ok: true, data: { message: "Now featured. The previous issue moved to the archive." } };
  }

  const updated = await supabase.rpc("admin_set_issue_status", {
    p_id: id,
    p_status: intent === "publish" ? "published" : "draft",
    p_actor_email: guard.actor,
  });

  if (updated.error) {
    return { ok: false, error: issueErrorMessage(updated.error.message) };
  }

  revalidateIssues();
  return {
    ok: true,
    data: { message: intent === "publish" ? "Published." : "Hidden from the website." },
  };
}
