"use server";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminActor } from "@/lib/auth/guard";
import { LEADERS } from "@/lib/constants/leaders";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { jsonField } from "@/lib/utils/json";
import {
  parseReleasedMedia,
  removeReleasedMediaFiles,
} from "@/features/media/server/data";
import { storeImage } from "@/features/media/server/store";
import { leaderFormSchema, leaderRowActionSchema } from "@/features/leaders/schemas";
import { leadersCacheTag, type LeaderActionState } from "@/features/leaders/types";
import { buildLeaderImportEntries, leaderErrorMessage } from "@/features/leaders/workflow";

function revalidateLeaders(): void {
  // Expire immediately so the homepage shows the change on the next visit.
  updateTag(leadersCacheTag);
  revalidatePath("/admin/leaders", "layout");
}

export async function saveLeaderAction(
  _state: LeaderActionState,
  formData: FormData
): Promise<LeaderActionState> {
  const parsed = leaderFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const guard = await requireAdminActor({ roles: ["admin"] });

  if (!guard.ok) {
    return guard;
  }

  const supabase = createSupabaseAdminClient();
  const input = parsed.data;
  const saved = await supabase.rpc("admin_save_leader", {
    p_id: input.id,
    p_name: input.name,
    p_name_ml: input.nameMl,
    p_role: input.role,
    p_role_ml: input.roleMl,
    p_bio: input.bio,
    p_bio_ml: input.bioMl,
    p_linkedin_url: input.linkedin,
    p_instagram_url: input.instagram,
    p_photo_media_id: input.photoMediaId,
    p_photo_alt: input.photoAlt,
    p_actor_email: guard.actor,
  });

  if (saved.error) {
    return { ok: false, error: leaderErrorMessage(saved.error.message) };
  }

  await removeReleasedMediaFiles(parseReleasedMedia(jsonField(saved.data, "released")));
  revalidateLeaders();

  const savedId = jsonField(saved.data, "id");

  if (!input.id && typeof savedId === "string") {
    redirect(`/admin/leaders/${savedId}?created=1`);
  }

  return { ok: true, data: { message: "Leader saved." } };
}

export async function leaderRowAction(
  _state: LeaderActionState,
  formData: FormData
): Promise<LeaderActionState> {
  const parsed = leaderRowActionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: "Could not save this change. Please refresh and try again." };
  }

  const guard = await requireAdminActor({ roles: ["admin"] });

  if (!guard.ok) {
    return guard;
  }

  const supabase = createSupabaseAdminClient();
  const { id, intent } = parsed.data;

  if (intent === "up" || intent === "down") {
    const moved = await supabase.rpc("admin_move_leader", {
      p_id: id,
      p_direction: intent,
      p_actor_email: guard.actor,
    });

    if (moved.error) {
      return { ok: false, error: leaderErrorMessage(moved.error.message) };
    }

    revalidateLeaders();
    return { ok: true, data: { message: moved.data ? "Order updated." : "Already at the end." } };
  }

  if (intent === "publish" || intent === "unpublish") {
    const updated = await supabase.rpc("admin_set_leader_status", {
      p_id: id,
      p_status: intent === "publish" ? "published" : "draft",
      p_actor_email: guard.actor,
    });

    if (updated.error) {
      return { ok: false, error: leaderErrorMessage(updated.error.message) };
    }

    revalidateLeaders();
    return {
      ok: true,
      data: { message: intent === "publish" ? "Published." : "Moved back to draft." },
    };
  }

  const deleted = await supabase.rpc("admin_delete_leader", {
    p_id: id,
    p_actor_email: guard.actor,
  });

  if (deleted.error) {
    return { ok: false, error: leaderErrorMessage(deleted.error.message) };
  }

  await removeReleasedMediaFiles(parseReleasedMedia(jsonField(deleted.data, "released")));
  revalidateLeaders();
  return { ok: true, data: { message: "Leader deleted." } };
}

async function importPhoto(sourcePhoto: string | null, actor: string): Promise<string> {
  if (!sourcePhoto) {
    return "";
  }

  const publicDir = path.join(process.cwd(), "public");
  const filePath = path.join(publicDir, sourcePhoto);

  // The pattern in buildLeaderImportEntries already blocks "..", this keeps it obvious.
  if (!filePath.startsWith(publicDir + path.sep)) {
    return "";
  }

  try {
    const stored = await storeImage(await readFile(filePath), "leader_photo", actor);

    return stored.ok ? stored.data.id : "";
  } catch {
    return "";
  }
}

export async function importLeadersAction(
  _state: LeaderActionState,
  _formData: FormData
): Promise<LeaderActionState> {
  void _formData;

  const guard = await requireAdminActor({ roles: ["admin"] });

  if (!guard.ok) {
    return guard;
  }

  const supabase = createSupabaseAdminClient();
  const entries = buildLeaderImportEntries(LEADERS);
  const { data: existing, error: existingError } = await supabase
    .from("leaders")
    .select("import_key")
    .in("import_key", entries.map((entry) => entry.import_key));

  if (existingError) {
    return { ok: false, error: leaderErrorMessage(undefined) };
  }

  const alreadyImported = new Set(existing.map((row) => row.import_key));
  const pending = entries.filter((entry) => !alreadyImported.has(entry.import_key));

  if (pending.length === 0) {
    return { ok: true, data: { message: "Bundled leaders were already imported." } };
  }

  const rows = [];

  for (const entry of pending) {
    const { sourcePhoto, ...row } = entry;
    rows.push({ ...row, photo_media_id: await importPhoto(sourcePhoto, guard.actor) });
  }

  const imported = await supabase.rpc("admin_import_leaders", {
    p_leaders: rows,
    p_actor_email: guard.actor,
  });

  if (imported.error) {
    return { ok: false, error: leaderErrorMessage(imported.error.message) };
  }

  revalidateLeaders();
  return {
    ok: true,
    data: { message: `Imported ${imported.data} leaders as drafts. Review and publish them below.` },
  };
}
