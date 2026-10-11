import "server-only";

import { processImage, type ImagePipelineError } from "@/lib/images/pipeline";
import { imagePurposes, type ImagePurpose } from "@/lib/images/purposes";
import {
  immutableCacheControl,
  siteImagesBucket,
  storedImagePaths,
} from "@/lib/images/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mediaRowToPreview } from "@/features/media/server/data";
import type { MediaPreview } from "@/features/media/types";

export type StoreImageResult =
  | { ok: true; data: MediaPreview }
  | { ok: false; error: ImagePipelineError | "storage" };

/** Runs the pipeline on raw bytes, stores the WebP output and records media_assets. */
export async function storeImage(
  input: Buffer,
  purpose: ImagePurpose,
  actorEmail: string
): Promise<StoreImageResult> {
  const processed = await processImage(input, imagePurposes[purpose]);

  if (!processed.ok) {
    return processed;
  }

  const image = processed.data;
  const { path, thumbPath } = storedImagePaths(purpose, image.contentHash);
  const supabase = createSupabaseAdminClient();
  const site = supabase.storage.from(siteImagesBucket);
  const options = {
    contentType: "image/webp",
    cacheControl: immutableCacheControl,
    // Same hash means same bytes, so overwriting an existing file is harmless.
    upsert: true,
  };
  const uploads = await Promise.all([
    site.upload(path, image.main, options),
    site.upload(thumbPath, image.thumb, options),
  ]);

  if (uploads.some((upload) => upload.error)) {
    return { ok: false, error: "storage" };
  }

  const recorded = await supabase.rpc("admin_record_media_asset", {
    p_actor_email: actorEmail,
    p_purpose: purpose,
    p_path: path,
    p_thumb_path: thumbPath,
    p_width: image.width,
    p_height: image.height,
    p_thumb_width: image.thumbWidth,
    p_thumb_height: image.thumbHeight,
    p_bytes: image.main.byteLength,
    p_thumb_bytes: image.thumb.byteLength,
    p_blur_data_url: image.blurDataUrl,
    p_content_hash: image.contentHash,
  });

  if (recorded.error || !recorded.data) {
    return { ok: false, error: "storage" };
  }

  return { ok: true, data: mediaRowToPreview(recorded.data) };
}
