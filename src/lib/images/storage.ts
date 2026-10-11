import "server-only";

import { serverEnv } from "@/lib/env.server";

export const siteImagesBucket = "site-images";
export const uploadsTmpBucket = "uploads-tmp";
export const issuePdfsBucket = "issue-pdfs";

/** Pipeline output is named by content hash, so it can be cached forever. */
export const immutableCacheControl = "31536000";

export function publicImageUrl(path: string): string {
  return `${serverEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${siteImagesBucket}/${path}`;
}

export function publicPdfUrl(path: string): string {
  return `${serverEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${issuePdfsBucket}/${path}`;
}

export function storedImagePaths(
  purpose: string,
  contentHash: string
): { path: string; thumbPath: string } {
  return {
    path: `${purpose}/${contentHash}.webp`,
    thumbPath: `${purpose}/${contentHash}-thumb.webp`,
  };
}
