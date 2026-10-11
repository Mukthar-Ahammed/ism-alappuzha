"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdminActor } from "@/lib/auth/guard";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { livePlatformLabels } from "@/lib/live-links";
import { setLiveSchema } from "@/features/live/schemas";
import { liveStatusCacheTag, type LiveActionState } from "@/features/live/types";

const genericLiveError = "Could not update the broadcast. Please refresh and try again.";

function revalidateLive(): void {
  // Expire immediately: visitors should never see a stale "live" or "offline" state.
  updateTag(liveStatusCacheTag);
  revalidatePath("/admin/live");
}

export async function setLiveAction(
  _state: LiveActionState,
  formData: FormData
): Promise<LiveActionState> {
  const parsed = setLiveSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? genericLiveError };
  }

  const guard = await requireAdminActor({ roles: ["admin"] });

  if (!guard.ok) {
    return guard;
  }

  const { link, title, titleMl, speaker, speakerMl } = parsed.data;
  const supabase = createSupabaseAdminClient();
  const saved = await supabase.rpc("admin_set_live", {
    p_platform: link.platform,
    p_youtube_id: link.platform === "youtube" ? link.videoId ?? null : null,
    p_watch_url: link.canonicalUrl,
    p_title: title,
    p_title_ml: titleMl,
    p_speaker: speaker,
    p_speaker_ml: speakerMl,
    p_actor_email: guard.actor,
  });

  if (saved.error) {
    return { ok: false, error: genericLiveError };
  }

  revalidateLive();
  return {
    ok: true,
    data: { message: `Live on ${livePlatformLabels[link.platform]}. The homepage updates within about 30 seconds.` },
  };
}

export async function endLiveAction(
  _state: LiveActionState,
  _formData: FormData
): Promise<LiveActionState> {
  void _formData;

  const guard = await requireAdminActor({ roles: ["admin"] });

  if (!guard.ok) {
    return guard;
  }

  const supabase = createSupabaseAdminClient();
  const ended = await supabase.rpc("admin_end_live", {
    p_actor_email: guard.actor,
  });

  if (ended.error) {
    return { ok: false, error: genericLiveError };
  }

  revalidateLive();
  return { ok: true, data: { message: "Broadcast ended. The homepage shows the next program again." } };
}
