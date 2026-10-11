import { facebookEmbedUrl, liveEmbedEnabled, youtubeEmbedUrl } from "@/lib/live-links";
import type { PublicLive } from "@/features/live/types";

/** The player URL for a live broadcast, or null when it must be shown as a link card. */
export function liveEmbedSource(live: PublicLive): string | null {
  if (!liveEmbedEnabled[live.platform]) {
    return null;
  }

  if (live.platform === "youtube" && live.youtubeId) {
    return youtubeEmbedUrl(live.youtubeId);
  }

  if (live.platform === "facebook" && live.watchUrl) {
    return facebookEmbedUrl(live.watchUrl);
  }

  return null;
}
