import "server-only";

import { unstable_cache } from "next/cache";
import { liveData } from "@/data/live";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingSchema, MissingMigrationError } from "@/lib/supabase/schema-errors";
import { liveHistoryDetailSchema } from "@/features/live/schemas";
import {
  liveStatusCacheTag,
  type LiveHistoryEntry,
  type PublicLive,
} from "@/features/live/types";
import type { Database } from "@/types/database";

type LiveRow = Database["public"]["Tables"]["live_status"]["Row"];

const baseLiveColumns = "is_live,platform,youtube_id,watch_url,title,speaker";
const liveColumns = `${baseLiveColumns},title_ml,speaker_ml`;
// The Malayalam columns come from the Malayalam content SQL; the admin asks for it when missing.
const malayalamMigrationFile = "supabase/phase12-malayalam-content-combined.sql";

export const bundledLive: PublicLive = {
  isLive: liveData.isLive,
  platform: "youtube",
  youtubeId: liveData.liveYoutubeId,
  watchUrl: `https://www.youtube.com/watch?v=${liveData.liveYoutubeId}`,
  title: liveData.liveTitle,
  speaker: null,
  titleMl: liveData.liveTitleMl,
  speakerMl: null,
};

export function liveRowToPublic(
  row: Pick<LiveRow, "is_live" | "platform" | "youtube_id" | "watch_url" | "title" | "speaker"> &
    Partial<Pick<LiveRow, "title_ml" | "speaker_ml">>
): PublicLive {
  return {
    isLive: row.is_live,
    platform: row.platform,
    youtubeId: row.youtube_id,
    watchUrl: row.watch_url,
    title: row.title || bundledLive.title,
    speaker: row.speaker,
    titleMl: row.title ? (row.title_ml ?? null) : bundledLive.titleMl,
    speakerMl: row.speaker_ml ?? null,
  };
}

async function loadLiveStatus(): Promise<PublicLive> {
  try {
    const supabase = createSupabaseAdminClient();
    const read = (columns: string) =>
      supabase
        .from("live_status")
        .select(columns)
        .eq("id", 1)
        .maybeSingle()
        .overrideTypes<Parameters<typeof liveRowToPublic>[0], { merge: false }>();
    let result = await read(liveColumns);

    // Before the Malayalam columns exist, the English ones still show.
    if (isMissingSchema(result.error)) {
      result = await read(baseLiveColumns);
    }

    return !result.error && result.data ? liveRowToPublic(result.data) : bundledLive;
  } catch {
    // Keep the public site available from bundled data when Supabase is unavailable.
    return bundledLive;
  }
}

/** Short cache: live status changes during events; admin actions also revalidate the tag. */
export const getPublicLive = unstable_cache(loadLiveStatus, ["live-status"], {
  tags: [liveStatusCacheTag],
  revalidate: 30,
});

export async function getAdminLiveStatus(): Promise<PublicLive> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("live_status")
    .select(liveColumns)
    .eq("id", 1)
    .maybeSingle();

  if (isMissingSchema(error)) {
    const base = await supabase.from("live_status").select(baseLiveColumns).eq("id", 1).maybeSingle();

    throw new MissingMigrationError(
      isMissingSchema(base.error)
        ? "supabase/phase6b-images-and-leaders-combined.sql, then supabase/phase7-live-and-programs-combined.sql"
        : malayalamMigrationFile
    );
  }

  if (error) {
    throw new Error("Could not load the live status.");
  }

  return data ? liveRowToPublic(data) : { ...bundledLive, isLive: false };
}

export async function getRecentLiveLinks(): Promise<LiveHistoryEntry[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("detail,created_at")
    .eq("entity", "live")
    .eq("action", "live_started")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return [];
  }

  const seen = new Set<string>();
  const history: LiveHistoryEntry[] = [];

  for (const row of data) {
    const detail = liveHistoryDetailSchema.safeParse(row.detail);

    if (detail.success && !seen.has(detail.data.watch_url)) {
      seen.add(detail.data.watch_url);
      history.push({
        platform: detail.data.platform,
        watchUrl: detail.data.watch_url,
        title: detail.data.title,
        speaker: detail.data.speaker,
        titleMl: detail.data.title_ml,
        speakerMl: detail.data.speaker_ml,
        startedAt: row.created_at,
      });
    }
  }

  return history.slice(0, 8);
}
