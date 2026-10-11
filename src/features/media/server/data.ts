import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publicImageUrl, siteImagesBucket } from "@/lib/images/storage";
import type { MediaPreview } from "@/features/media/types";
import type { Database } from "@/types/database";

type MediaRow = Database["public"]["Tables"]["media_assets"]["Row"];

export const mediaPreviewColumns = "id,path,thumb_path,width,height,bytes,blur_data_url,alt";

export function mediaRowToPreview(
  row: Pick<MediaRow, "id" | "path" | "thumb_path" | "width" | "height" | "bytes" | "blur_data_url" | "alt">
): MediaPreview {
  return {
    id: row.id,
    url: publicImageUrl(row.path),
    thumbUrl: publicImageUrl(row.thumb_path),
    width: row.width,
    height: row.height,
    bytes: row.bytes,
    blurDataUrl: row.blur_data_url,
    alt: row.alt,
  };
}

export type ReleasedMedia = { path: string; thumb_path: string };

export function parseReleasedMedia(value: unknown): ReleasedMedia | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "path" in value &&
    "thumb_path" in value &&
    typeof value.path === "string" &&
    typeof value.thumb_path === "string"
  ) {
    return { path: value.path, thumb_path: value.thumb_path };
  }

  return null;
}

/** Removes stored files of a media row the database has already released. */
export async function removeReleasedMediaFiles(released: ReleasedMedia | null): Promise<void> {
  if (!released) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage
    .from(siteImagesBucket)
    .remove([released.path, released.thumb_path]);

  if (error) {
    // The row is gone; leftover files are harmless and only cost storage.
    console.error("[media] could not remove released files:", error.name);
  }
}
