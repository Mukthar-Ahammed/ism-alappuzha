export type VideoCategory = "All" | "Speeches" | "Campaigns" | "Youth";
export type VideoPlatform = "YouTube" | "Instagram" | "Facebook";

export interface VideoItem {
  id: string;
  title: string;
  /** Malayalam versions from the admin; absent shows the English. */
  titleMl?: string;
  category: "Speeches" | "Campaigns" | "Youth";
  speaker: string;
  speakerMl?: string;
  platform: VideoPlatform;
  youtubeId?: string;
  url: string;
  thumbnailUrl?: string;
  /** Tiny placeholder shown while an uploaded thumbnail loads. */
  thumbnailBlurDataUrl?: string;
  date: string;
  duration?: string;
}

export const videoCategories: VideoCategory[] = [
  "All",
  "Speeches",
  "Campaigns",
  "Youth",
];

/**
 * Derives the optimal thumbnail URL for a video item.
 * For YouTube videos, derives high-quality thumbnail from the video ID if not specified.
 */
export function getThumbnailUrl(video: VideoItem): string {
  if (video.thumbnailUrl) {
    return video.thumbnailUrl;
  }
  if (video.youtubeId) {
    return `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  }
  return "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop";
}
