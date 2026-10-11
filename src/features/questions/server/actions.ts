"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireAdminAction } from "@/lib/auth/guard";
import { publishedQaCacheTag } from "@/lib/qa/public";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  archiveActionSchema,
  baseQuestionActionSchema,
  deleteActionSchema,
  notesActionSchema,
  publishActionSchema,
  replyActionSchema,
} from "@/features/questions/schemas";
import { canPublishQuestion, QUESTION_REVIEW_REQUIRED } from "@/features/questions/workflow";
import { sendQuestionEmail } from "@/features/questions/server/email";
import type { QuestionActionState } from "@/features/questions/types";
import type { ActionResult, AdminContext } from "@/lib/auth/types";

const staleError =
  "Someone else changed this question. Refresh the page before saving.";

function parseForm<T extends z.ZodType>(
  schema: T,
  formData: FormData
) {
  return schema.safeParse(Object.fromEntries(formData));
}

function userSafeError(message?: string): string {
  if (message === "stale_question") {
    return staleError;
  }

  return "Could not save this change. Please refresh and try again.";
}

function revalidateQuestion(questionId: string): void {
  revalidatePath("/admin");
  revalidatePath(`/admin/questions/${questionId}`);
  revalidatePath("/");
  revalidatePath("/api/qa/published");
  revalidateTag(publishedQaCacheTag, "max");
}

type ActionRoles = readonly ["admin"] | readonly ["admin", "reviewer"];

function withActorEmail(admin: AdminContext) {
  return { admin, email: admin.user.email || "unknown" };
}

async function guardedAdminEmail(roles: ActionRoles) {
  return withActorEmail(await requireAdmin({ roles }));
}

async function guardedStateAdmin(
  roles: ActionRoles
): Promise<ActionResult<ReturnType<typeof withActorEmail>>> {
  const admin = await requireAdminAction({ roles });

  return admin.ok ? { ok: true, data: withActorEmail(admin.data) } : admin;
}

export async function saveDraft(
  _state: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  const parsed = parseForm(replyActionSchema, formData);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid reply." };
  }

  const guard = await guardedStateAdmin(["admin", "reviewer"]);

  if (!guard.ok) {
    return { ok: false, error: guard.error };
  }

  const { admin, email } = guard.data;
  const supabase = createSupabaseAdminClient();
  const result = await supabase.rpc("admin_save_question_draft", {
    p_question_id: parsed.data.id,
    p_answer: parsed.data.answer,
    p_expected_updated_at: parsed.data.updatedAt,
    p_actor_email: email,
    p_actor_id: admin.user.id,
  });

  if (result.error) {
    return { ok: false, error: userSafeError(result.error.message) };
  }

  revalidateQuestion(parsed.data.id);
  return { ok: true, message: "Draft saved." };
}

export async function sendReply(
  _state: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  const parsed = parseForm(replyActionSchema, formData);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid reply." };
  }

  if (QUESTION_REVIEW_REQUIRED) {
    return { ok: false, error: "Review is required before sending replies." };
  }

  const guard = await guardedStateAdmin(["admin", "reviewer"]);

  if (!guard.ok) {
    return { ok: false, error: guard.error };
  }

  const { admin, email } = guard.data;
  const supabase = createSupabaseAdminClient();
  const result = await supabase.rpc("admin_send_question_reply", {
    p_question_id: parsed.data.id,
    p_answer: parsed.data.answer,
    p_expected_updated_at: parsed.data.updatedAt,
    p_actor_email: email,
    p_actor_id: admin.user.id,
  });

  if (result.error) {
    return { ok: false, error: userSafeError(result.error.message) };
  }

  await sendQuestionEmail(result.data, "reply");
  revalidateQuestion(parsed.data.id);
  return { ok: true, message: "Reply sent." };
}

export async function sendCorrection(
  _state: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  const parsed = parseForm(replyActionSchema, formData);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid reply." };
  }

  const guard = await guardedStateAdmin(["admin"]);

  if (!guard.ok) {
    return { ok: false, error: guard.error };
  }

  const { admin, email } = guard.data;
  const supabase = createSupabaseAdminClient();
  const result = await supabase.rpc("admin_send_question_correction", {
    p_question_id: parsed.data.id,
    p_answer: parsed.data.answer,
    p_expected_updated_at: parsed.data.updatedAt,
    p_actor_email: email,
    p_actor_id: admin.user.id,
  });

  if (result.error) {
    return { ok: false, error: userSafeError(result.error.message) };
  }

  await sendQuestionEmail(result.data, "correction");
  revalidateQuestion(parsed.data.id);
  return { ok: true, message: "Correction sent." };
}

export async function saveNotes(
  _state: QuestionActionState,
  formData: FormData
): Promise<QuestionActionState> {
  const parsed = parseForm(notesActionSchema, formData);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid notes." };
  }

  const guard = await guardedStateAdmin(["admin", "reviewer"]);

  if (!guard.ok) {
    return { ok: false, error: guard.error };
  }

  const { email } = guard.data;
  const supabase = createSupabaseAdminClient();
  const result = await supabase.rpc("admin_save_question_notes", {
    p_question_id: parsed.data.id,
    p_notes: parsed.data.notes ?? "",
    p_expected_updated_at: parsed.data.updatedAt,
    p_actor_email: email,
  });

  if (result.error) {
    return { ok: false, error: userSafeError(result.error.message) };
  }

  revalidateQuestion(parsed.data.id);
  return { ok: true, message: "Notes saved." };
}

export async function archive(formData: FormData): Promise<void> {
  const parsed = parseForm(archiveActionSchema, formData);

  if (!parsed.success) {
    redirect("/admin?error=archive");
  }

  const { email } = await guardedAdminEmail(["admin"]);
  const supabase = createSupabaseAdminClient();
  const result = await supabase.rpc("admin_archive_question", {
    p_question_id: parsed.data.id,
    p_reason: parsed.data.reason,
    p_expected_updated_at: parsed.data.updatedAt,
    p_actor_email: email,
  });

  revalidateQuestion(parsed.data.id);
  redirect(result.error ? `/admin/questions/${parsed.data.id}?error=stale` : "/admin?archived=1");
}

export async function restore(formData: FormData): Promise<void> {
  const parsed = parseForm(baseQuestionActionSchema, formData);

  if (!parsed.success) {
    redirect("/admin?error=restore");
  }

  const { email } = await guardedAdminEmail(["admin"]);
  const supabase = createSupabaseAdminClient();
  const result = await supabase.rpc("admin_restore_question", {
    p_question_id: parsed.data.id,
    p_expected_updated_at: parsed.data.updatedAt,
    p_actor_email: email,
  });

  revalidateQuestion(parsed.data.id);
  redirect(result.error ? `/admin/questions/${parsed.data.id}?error=stale` : "/admin?restored=1");
}

export async function publish(formData: FormData): Promise<void> {
  const parsed = parseForm(publishActionSchema, formData);

  if (!parsed.success) {
    redirect("/admin?error=publish");
  }

  const { email } = await guardedAdminEmail(["admin"]);
  const supabase = createSupabaseAdminClient();
  const current = await supabase
    .from("questions")
    .select("is_private,status,answer")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (current.error || !current.data || !canPublishQuestion(current.data)) {
    redirect(`/admin/questions/${parsed.data.id}?error=private-publish`);
  }

  const result = await supabase.rpc("admin_publish_question", {
    p_question_id: parsed.data.id,
    p_public_question: parsed.data.publicQuestion,
    p_expected_updated_at: parsed.data.updatedAt,
    p_actor_email: email,
  });

  revalidateQuestion(parsed.data.id);
  redirect(result.error ? `/admin/questions/${parsed.data.id}?error=stale` : `/admin/questions/${parsed.data.id}?published=1`);
}

export async function unpublish(formData: FormData): Promise<void> {
  const parsed = parseForm(baseQuestionActionSchema, formData);

  if (!parsed.success) {
    redirect("/admin?error=unpublish");
  }

  const { email } = await guardedAdminEmail(["admin"]);
  const supabase = createSupabaseAdminClient();
  const result = await supabase.rpc("admin_unpublish_question", {
    p_question_id: parsed.data.id,
    p_expected_updated_at: parsed.data.updatedAt,
    p_actor_email: email,
  });

  revalidateQuestion(parsed.data.id);
  redirect(result.error ? `/admin/questions/${parsed.data.id}?error=stale` : `/admin/questions/${parsed.data.id}?unpublished=1`);
}

export async function deleteQuestion(formData: FormData): Promise<void> {
  const parsed = parseForm(deleteActionSchema, formData);

  if (!parsed.success) {
    redirect("/admin?error=delete");
  }

  const { email } = await guardedAdminEmail(["admin"]);
  const supabase = createSupabaseAdminClient();
  const result = await supabase.rpc("admin_delete_question", {
    p_question_id: parsed.data.id,
    p_expected_updated_at: parsed.data.updatedAt,
    p_actor_email: email,
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/api/qa/published");
  revalidateTag(publishedQaCacheTag, "max");
  redirect(result.error ? `/admin/questions/${parsed.data.id}?error=stale` : "/admin?deleted=1");
}
