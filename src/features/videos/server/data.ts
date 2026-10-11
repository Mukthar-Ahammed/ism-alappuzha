import "server-only";

import { unstable_cache } from "next/cache";
import type { VideoItem } from "@/data/videos";
import { livePlatformLabels } from "@/lib/live-links";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingSchema, MissingMigrationError } from "@/lib/supabase/schema-errors";
import { mediaPreviewColumns, mediaRowToPreview } from "@/features/media/server/data";
import { videosCacheTag, videosPageSize, type AdminVideo } from "@/features/videos/types";

const videosMigrationFile = "supabase/phase7b-program-format-and-videos-combined.sql";
const malayalamMigrationFile = "supabase/phase12-malayalam-content-combined.sql";

const baseVideoColumns = `id,title,speaker,category,platform,watch_url,youtube_id,recorded_on,duration,status,thumbnail:media_assets(${mediaPreviewColumns})`;
const videoColumns = `${baseVideoColumns},title_ml,speaker_ml`;

type VideoRow = {
  id: string;
  title: string;
  speaker: string;
  /** Missing until the Malayalam content SQL has run. */
  title_ml?: string | null;
  speaker_ml?: string | null;
  category: AdminVideo["category"];
  platform: AdminVideo["platform"];
  watch_url: string;
  youtube_id: string | null;
  recorded_on: string;
  duration: string | null;
  status: AdminVideo["status"];
  thumbnail: Parameters<typeof mediaRowToPreview>[0] | null;
};

/** Names the SQL still to run: the videos table itself, or only its Malayalam columns. */
async function missingVideosMigration(): Promise<MissingMigrationError> {
  const base = await createSupabaseAdminClient().from("videos").select("id").limit(1);

  return new MissingMigrationError(isMissingSchema(base.error) ? videosMigrationFile : malayalamMigrationFile);
}

function toAdminVideo(row: VideoRow): AdminVideo {
  return {
    id: row.id,
    title: row.title,
    speaker: row.speaker,
    titleMl: row.title_ml ?? null,
    speakerMl: row.speaker_ml ?? null,
    category: row.category,
    platform: row.platform,
    watchUrl: row.watch_url,
    youtubeId: row.youtube_id,
    recordedOn: row.recorded_on,
    duration: row.duration,
    status: row.status,
    thumbnail: row.thumbnail ? mediaRowToPreview(row.thumbnail) : null,
  };
}

/** "2026-09-14" → "Sep 2026", the date style the video cards use. */
export function formatVideoDate(recordedOn: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${recordedOn}T00:00:00Z`));
}

export function adminVideoToPublic(video: AdminVideo): VideoItem {
  return {
    id: video.id,
    title: video.title,
    titleMl: video.titleMl ?? undefined,
    category: video.category,
    speaker: video.speaker,
    speakerMl: video.speakerMl ?? undefined,
    platform: livePlatformLabels[video.platform],
    youtubeId: video.youtubeId ?? undefined,
    url: video.watchUrl,
    thumbnailUrl: video.thumbnail?.url,
    thumbnailBlurDataUrl: video.thumbnail?.blurDataUrl,
    date: formatVideoDate(video.recordedOn),
    duration: video.duration ?? undefined,
  };
}

export async function listAdminVideos(
  page: number
): Promise<{ videos: AdminVideo[]; totalPages: number }> {
  const supabase = createSupabaseAdminClient();
  const from = (page - 1) * videosPageSize;
  const { data, error, count } = await supabase
    .from("videos")
    .select(videoColumns, { count: "exact" })
    .order("recorded_on", { ascending: false })
    .order("id", { ascending: true })
    .range(from, from + videosPageSize - 1)
    .overrideTypes<VideoRow[], { merge: false }>();

  if (isMissingSchema(error)) {
    throw await missingVideosMigration();
  }

  if (error) {
    throw new Error("Could not load videos.");
  }

  return {
    videos: data.map(toAdminVideo),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / videosPageSize)),
  };
}

export async function getAdminVideo(id: string): Promise<AdminVideo | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("videos")
    .select(videoColumns)
    .eq("id", id)
    .overrideTypes<VideoRow[], { merge: false }>();

  if (isMissingSchema(error)) {
    throw await missingVideosMigration();
  }

  if (error) {
    throw new Error("Could not load this video.");
  }

  const row = data[0];

  return row ? toAdminVideo(row) : null;
}

async function loadPublishedVideos(): Promise<VideoItem[]> {
  const supabase = createSupabaseAdminClient();
  const read = (columns: string) =>
    supabase
      .from("videos")
      .select(columns)
      .eq("status", "published")
      .order("recorded_on", { ascending: false })
      .limit(30)
      .overrideTypes<VideoRow[], { merge: false }>();
  let { data, error } = await read(videoColumns);

  // Before the Malayalam columns exist, the English ones still show.
  if (isMissingSchema(error)) {
    ({ data, error } = await read(baseVideoColumns));
  }

  if (error || !data) {
    // Thrown so a failed read is never cached as "no videos".
    throw new Error("Could not load videos.");
  }

  return data.map((row) => adminVideoToPublic(toAdminVideo(row)));
}

const getCachedPublishedVideos = unstable_cache(loadPublishedVideos, ["published-videos"], {
  tags: [videosCacheTag],
  revalidate: 3600,
});

/** Only videos published in the admin appear; there is no placeholder fallback. */
export async function getPublicVideos(): Promise<VideoItem[]> {
  try {
    return await getCachedPublishedVideos();
  } catch {
    return [];
  }
}
