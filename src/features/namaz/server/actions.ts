"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminActor } from "@/lib/auth/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingSchema } from "@/lib/supabase/schema-errors";
import { jsonField } from "@/lib/utils/json";
import { namazRowActionSchema, namazStepFormSchema } from "@/features/namaz/schemas";
import { namazCacheTag, namazMigrationFile, type NamazActionState } from "@/features/namaz/types";
import { namazErrorMessage } from "@/features/namaz/workflow";

// Reviewers check the religious text, so they edit the guide alongside admins.
const namazRoles = ["admin", "reviewer"] as const;

function actionErrorMessage(error: { message: string; code?: string }): string {
  if (isMissingSchema(error)) {
    return `Database setup is incomplete. Run ${namazMigrationFile} in the Supabase SQL Editor, then try again.`;
  }

  return namazErrorMessage(error.message);
}

function revalidateNamaz(): void {
  // Expire immediately so the homepage shows the change on the next visit.
  updateTag(namazCacheTag);
  revalidatePath("/admin/namaz", "layout");
}

export async function saveNamazStepAction(
  _state: NamazActionState,
  formData: FormData
): Promise<NamazActionState> {
  const parsed = namazStepFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const guard = await requireAdminActor({ roles: namazRoles });

  if (!guard.ok) {
    return guard;
  }

  const input = parsed.data;
  const saved = await createSupabaseAdminClient().rpc("admin_save_namaz_step", {
    p_id: input.id,
    p_name: input.name,
    p_name_ml: input.nameMl,
    p_what_to_do: input.whatToDo,
    p_what_to_do_ml: input.whatToDoMl,
    p_arabic: input.arabic,
    p_transliteration: input.transliteration,
    p_transliteration_ml: input.transliterationMl,
    p_malayalam: input.malayalam,
    p_dos: input.dos,
    p_dos_ml: input.dosMl,
    p_donts: input.donts,
    p_donts_ml: input.dontsMl,
    p_is_repeat_node: input.isRepeatNode,
    p_actor_email: guard.actor,
  });

  if (saved.error) {
    return { ok: false, error: actionErrorMessage(saved.error) };
  }

  revalidateNamaz();

  const savedId = jsonField(saved.data, "id");

  if (!input.id && typeof savedId === "string") {
    redirect(`/admin/namaz/${savedId}?created=1`);
  }

  return { ok: true, data: { message: "Saved." } };
}

const rowMessages = {
  publish: "Published. It now shows in the Namaz guide.",
  unpublish: "Hidden from the website.",
  up: "Moved up.",
  down: "Moved down.",
  delete: "Step deleted.",
} as const;

export async function namazRowAction(
  _state: NamazActionState,
  formData: FormData
): Promise<NamazActionState> {
  const parsed = namazRowActionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: namazErrorMessage(undefined) };
  }

  const guard = await requireAdminActor({ roles: namazRoles });

  if (!guard.ok) {
    return guard;
  }

  const supabase = createSupabaseAdminClient();
  const { id, intent } = parsed.data;
  const actor = guard.actor;
  let result: { error: { message: string; code?: string } | null };

  if (intent === "delete") {
    result = await supabase.rpc("admin_delete_namaz_step", { p_id: id, p_actor_email: actor });
  } else if (intent === "up" || intent === "down") {
    result = await supabase.rpc("admin_move_namaz_step", {
      p_id: id,
      p_direction: intent,
      p_actor_email: actor,
    });
  } else {
    result = await supabase.rpc("admin_set_namaz_step_status", {
      p_id: id,
      p_status: intent === "publish" ? "published" : "draft",
      p_actor_email: actor,
    });
  }

  if (result.error) {
    return { ok: false, error: actionErrorMessage(result.error) };
  }

  revalidateNamaz();
  return { ok: true, data: { message: rowMessages[intent] } };
}
