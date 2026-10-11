import type { MessageActionState } from "@/lib/auth/types";
import type { LivePlatform } from "@/lib/live-links";

export const liveStatusCacheTag = "live-status";

/** What the public Live Now section and navbar need to render. */
export type PublicLive = {
  isLive: boolean;
  platform: LivePlatform;
  youtubeId: string | null;
  watchUrl: string | null;
  title: string;
  speaker: string | null;
  /** Malayalam versions; null shows the English. */
  titleMl: string | null;
  speakerMl: string | null;
};

export type LiveHistoryEntry = {
  platform: LivePlatform;
  watchUrl: string;
  title: string | null;
  speaker: string | null;
  titleMl: string | null;
  speakerMl: string | null;
  startedAt: string;
};

export type LiveActionState = MessageActionState;
