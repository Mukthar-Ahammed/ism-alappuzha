"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminActor } from "@/lib/auth/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { jsonField } from "@/lib/utils/json";
import {
  parseReleasedMedia,
  removeReleasedMediaFiles,
} from "@/features/media/server/data";
import { programFormSchema, programRowActionSchema } from "@/features/programs/schemas";
import { programsCacheTag, type ProgramActionState } from "@/features/programs/types";

function programError(message: string | undefined): string {
  return message === "program_not_found"
    ? "That program no longer exists. Refresh the page."
    : "Could not save this change. Please refresh and try again.";
}

function revalidatePrograms(): void {
  // Expire immediately so the homepage shows the change on the next visit.
  updateTag(programsCacheTag);
  revalidatePath("/admin/programs", "layout");
}

export async function saveProgramAction(
  _state: ProgramActionState,
  formData: FormData
): Promise<ProgramActionState> {
  const parsed = programFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const guard = await requireAdminActor({ roles: ["admin"] });

  if (!guard.ok) {
    return guard;
  }

  const input = parsed.data;
  const supabase = createSupabaseAdminClient();
  const saved = await supabase.rpc("admin_save_program", {
    p_id: input.id,
    p_title: input.title,
    p_speaker: input.speaker,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_format: input.format,
    p_venue: input.venue,
    p_description: input.description,
    p_link_url: input.link,
    p_poster_media_id: input.posterMediaId,
    p_poster_alt: input.posterAlt,
    p_title_ml: input.titleMl,
    p_speaker_ml: input.speakerMl,
    p_venue_ml: input.venueMl,
    p_description_ml: input.descriptionMl,
    p_actor_email: guard.actor,
  });

  if (saved.error) {
    return { ok: false, error: programError(saved.error.message) };
  }

  await removeReleasedMediaFiles(parseReleasedMedia(jsonField(saved.data, "released")));
  revalidatePrograms();

  const savedId = jsonField(saved.data, "id");

  if (!input.id && typeof savedId === "string") {
    redirect(`/admin/programs/${savedId}?created=1`);
  }

  return { ok: true, data: { message: "Program saved." } };
}

export async function programRowAction(
  _state: ProgramActionState,
  formData: FormData
): Promise<ProgramActionState> {
  const parsed = programRowActionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: programError(undefined) };
  }

  const guard = await requireAdminActor({ roles: ["admin"] });

  if (!guard.ok) {
    return guard;
  }

  const supabase = createSupabaseAdminClient();

  if (parsed.data.intent === "cancel") {
    const cancelled = await supabase.rpc("admin_cancel_program", {
      p_id: parsed.data.id,
      p_actor_email: guard.actor,
    });

    if (cancelled.error) {
      return { ok: false, error: programError(cancelled.error.message) };
    }

    revalidatePrograms();
    return { ok: true, data: { message: "Program cancelled and removed from the homepage." } };
  }

  const duplicated = await supabase.rpc("admin_duplicate_program", {
    p_id: parsed.data.id,
    p_actor_email: guard.actor,
  });

  if (duplicated.error || !duplicated.data) {
    return { ok: false, error: programError(duplicated.error?.message) };
  }

  revalidatePrograms();
  redirect(`/admin/programs/${duplicated.data}?duplicated=1`);
}
