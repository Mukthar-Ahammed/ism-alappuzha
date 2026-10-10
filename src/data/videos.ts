export type VideoCategory = "All" | "Speeches" | "Campaigns" | "Youth";
export type VideoPlatform = "YouTube" | "Instagram" | "Facebook";

export interface VideoItem {
  id: string;
  title: string;
  category: "Speeches" | "Campaigns" | "Youth";
  speaker: string;
  platform: VideoPlatform;
  youtubeId?: string;
  url: string;
  thumbnailUrl?: string;
  date: string;
  duration?: string;
}

export const videoCategories: VideoCategory[] = [
  "All",
  "Speeches",
  "Campaigns",
  "Youth",
];

export const videosData: VideoItem[] = [
  {
    id: "vid-1",
    title: "TODO: Learn. Practise. Serve. — Keynote Address at Alappuzha Town Hall",
    category: "Speeches",
    speaker: "Dr. Tariq Al-Mansoor",
    platform: "YouTube",
    youtubeId: "7ahg0Z35i98",
    url: "https://www.youtube.com/watch?v=7ahg0Z35i98",
    date: "Sep 2026",
    duration: "42:15",
  },
  {
    "id": "vid-2",
    title: "TODO: District Youth Campaign 2026: Intellectual Fortitude & Faith",
    category: "Campaigns",
    speaker: "Amina Al-Farooqi",
    platform: "YouTube",
    youtubeId: "7ahg0Z35i98",
    url: "https://www.youtube.com/watch?v=7ahg0Z35i98",
    date: "Aug 2026",
    duration: "28:30",
  },
  {
    id: "vid-3",
    title: "TODO: Navigating Campus Challenges: Ethics & Student Life",
    category: "Youth",
    speaker: "Zayd Ibn Sulayman",
    platform: "Instagram",
    url: "https://instagram.com/p/placeholder1",
    thumbnailUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop",
    date: "Aug 2026",
  },
  {
    id: "vid-4",
    title: "TODO: The Quest for Truth: Science, Philosophy & Qur'anic Worldview",
    category: "Speeches",
    speaker: "Prof. Abdur Rahman",
    platform: "YouTube",
    youtubeId: "7ahg0Z35i98",
    url: "https://www.youtube.com/watch?v=7ahg0Z35i98",
    date: "Jul 2026",
    duration: "55:10",
  },
  {
    id: "vid-5",
    title: "TODO: Clean Campus & Green Alappuzha Environmental Initiative",
    category: "Campaigns",
    speaker: "Bilal Hassan",
    platform: "Facebook",
    url: "https://facebook.com/watch/placeholder2",
    thumbnailUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop",
    date: "Jul 2026",
  },
  {
    id: "vid-6",
    title: "TODO: Building Character: Mentorship & Leadership Workshop",
    category: "Youth",
    speaker: "Mariam Al-Husseini",
    platform: "YouTube",
    youtubeId: "7ahg0Z35i98",
    url: "https://www.youtube.com/watch?v=7ahg0Z35i98",
    date: "Jun 2026",
    duration: "34:20",
  },
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
