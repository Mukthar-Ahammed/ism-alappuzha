import type { MediaPreview } from "@/features/media/types";
import type { MessageActionState } from "@/lib/auth/types";
import type { LivePlatform } from "@/lib/live-links";
import type { VideoCategoryValue } from "@/features/videos/schemas";

export const videosCacheTag = "published-videos";

export const videosPageSize = 25;

export type AdminVideo = {
  id: string;
  title: string;
  speaker: string;
  /** Malayalam versions; null shows the English. */
  titleMl: string | null;
  speakerMl: string | null;
  category: VideoCategoryValue;
  platform: LivePlatform;
  watchUrl: string;
  youtubeId: string | null;
  recordedOn: string;
  duration: string | null;
  status: "draft" | "published";
  thumbnail: MediaPreview | null;
};

export type VideoActionState = MessageActionState;
