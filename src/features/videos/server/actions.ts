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
import { videoFormSchema, videoRowActionSchema } from "@/features/videos/schemas";
import { videosCacheTag, type VideoActionState } from "@/features/videos/types";

function videoError(message: string | undefined): string {
  return message === "video_not_found"
    ? "That video no longer exists. Refresh the page."
    : "Could not save this change. Please refresh and try again.";
}

function revalidateVideos(): void {
  // Expire immediately so the homepage shows the change on the next visit.
  updateTag(videosCacheTag);
  revalidatePath("/admin/videos", "layout");
}

export async function saveVideoAction(
  _state: VideoActionState,
  formData: FormData
): Promise<VideoActionState> {
  const parsed = videoFormSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const guard = await requireAdminActor({ roles: ["admin"] });

  if (!guard.ok) {
    return guard;
  }

  const input = parsed.data;
  const supabase = createSupabaseAdminClient();
  const saved = await supabase.rpc("admin_save_video", {
    p_id: input.id,
    p_title: input.title,
    p_title_ml: input.titleMl,
    p_speaker: input.speaker,
    p_speaker_ml: input.speakerMl,
    p_category: input.category,
    p_platform: input.link.platform,
    p_watch_url: input.link.canonicalUrl,
    p_youtube_id: input.link.platform === "youtube" ? input.link.videoId ?? null : null,
    p_recorded_on: input.recordedOn,
    p_duration: input.duration,
    p_thumbnail_media_id: input.thumbnailMediaId,
    p_thumbnail_alt: input.thumbnailAlt,
    p_actor_email: guard.actor,
  });

  if (saved.error) {
    return { ok: false, error: videoError(saved.error.message) };
  }

  await removeReleasedMediaFiles(parseReleasedMedia(jsonField(saved.data, "released")));
  revalidateVideos();

  const savedId = jsonField(saved.data, "id");

  if (!input.id && typeof savedId === "string") {
    redirect(`/admin/videos/${savedId}?created=1`);
  }

  return { ok: true, data: { message: "Video saved." } };
}

export async function videoRowAction(
  _state: VideoActionState,
  formData: FormData
): Promise<VideoActionState> {
  const parsed = videoRowActionSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: videoError(undefined) };
  }

  const guard = await requireAdminActor({ roles: ["admin"] });

  if (!guard.ok) {
    return guard;
  }

  const supabase = createSupabaseAdminClient();
  const { id, intent } = parsed.data;

  if (intent === "delete") {
    const deleted = await supabase.rpc("admin_delete_video", {
      p_id: id,
      p_actor_email: guard.actor,
    });

    if (deleted.error) {
      return { ok: false, error: videoError(deleted.error.message) };
    }

    await removeReleasedMediaFiles(parseReleasedMedia(jsonField(deleted.data, "released")));
    revalidateVideos();
    return { ok: true, data: { message: "Video deleted." } };
  }

  const updated = await supabase.rpc("admin_set_video_status", {
    p_id: id,
    p_status: intent === "publish" ? "published" : "draft",
    p_actor_email: guard.actor,
  });

  if (updated.error) {
    return { ok: false, error: videoError(updated.error.message) };
  }

  revalidateVideos();
  return {
    ok: true,
    data: { message: intent === "publish" ? "Published." : "Hidden from the homepage." },
  };
}
