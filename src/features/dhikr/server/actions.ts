"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminActor } from "@/lib/auth/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingSchema } from "@/lib/supabase/schema-errors";
import { jsonField } from "@/lib/utils/json";
import { dhikrFormSchema, dhikrRowActionSchema } from "@/features/dhikr/schemas";
import { dhikrCacheTag, dhikrMigrationFile, type DhikrActionState } from "@/features/dhikr/types";
import { dhikrErrorMessage } from "@/features/dhikr/workflow";

// Reviewers check the religious text, so they manage the library alongside admins.
const dhikrRoles = ["admin", "reviewer"] as const;

function actionErrorMessage(error: { message: string; code?: string }): string {
  if (isMissingSchema(error)) {
    return `Database setup is incomplete. Run ${dhikrMigrationFile} in the Supabase SQL Editor, then try again.`;
  }

  return dhikrErrorMessage(error.message);
}

function revalidateDhikr(): void {
  // Expire immediately so the homepage and /dhikr show the change on the next visit.
  updateTag(dhikrCacheTag);
  revalidatePath("/admin/dhikr", "layout");
}

export async function saveDhikrAction(
  _state: DhikrActionState,
  formData: FormData
): Promise<DhikrActionState> {
  const parsed = dhikrFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const guard = await requireAdminActor({ roles: dhikrRoles });

  if (!guard.ok) {
    return guard;
  }

  const input = parsed.data;
  const supabase = createSupabaseAdminClient();
  const saved = await supabase.rpc("admin_save_dhikr", {
    p_id: input.id,
    p_title: input.title,
    p_category: input.category,
    p_arabic: input.arabic,
    p_transliteration: input.transliteration,
    p_transliteration_ml: input.transliterationMl,
    p_malayalam: input.malayalam,
    p_reference: input.reference,
    p_reference_ml: input.referenceMl,
    p_repeat_count: input.repeatCount,
    p_actor_email: guard.actor,
  });

  if (saved.error) {
    return { ok: false, error: actionErrorMessage(saved.error) };
  }

  revalidateDhikr();

  const savedId = jsonField(saved.data, "id");

  if (!input.id && typeof savedId === "string") {
    redirect(`/admin/dhikr/${savedId}?created=1`);
  }

  return {
    ok: true,
    data: {
      message:
        jsonField(saved.data, "review_cleared") === true
          ? "Saved. The text changed, so it is back in drafts until it is checked again."
          : "Saved.",
    },
  };
}

const rowMessages = {
  check: "Marked as checked. It can now be published.",
  uncheck: "Check withdrawn. The entry is no longer on the website.",
  publish: "Published.",
  unpublish: "Hidden from the website.",
  up: "Moved up.",
  down: "Moved down.",
  delete: "Entry deleted.",
} as const;

export async function dhikrRowAction(
  _state: DhikrActionState,
  formData: FormData
): Promise<DhikrActionState> {
  const parsed = dhikrRowActionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: dhikrErrorMessage(undefined) };
  }

  const guard = await requireAdminActor({ roles: dhikrRoles });

  if (!guard.ok) {
    return guard;
  }

  const supabase = createSupabaseAdminClient();
  const { id, intent } = parsed.data;
  const actor = guard.actor;
  let result: { error: { message: string; code?: string } | null };

  if (intent === "delete") {
    result = await supabase.rpc("admin_delete_dhikr", { p_id: id, p_actor_email: actor });
  } else if (intent === "check" || intent === "uncheck") {
    result = await supabase.rpc("admin_set_dhikr_review", {
      p_id: id,
      p_reviewed: intent === "check",
      p_actor_email: actor,
    });
  } else if (intent === "up" || intent === "down") {
    result = await supabase.rpc("admin_move_dhikr", {
      p_id: id,
      p_direction: intent,
      p_actor_email: actor,
    });
  } else {
    result = await supabase.rpc("admin_set_dhikr_status", {
      p_id: id,
      p_status: intent === "publish" ? "published" : "draft",
      p_actor_email: actor,
    });
  }

  if (result.error) {
    return { ok: false, error: actionErrorMessage(result.error) };
  }

  revalidateDhikr();
  return { ok: true, data: { message: rowMessages[intent] } };
}
