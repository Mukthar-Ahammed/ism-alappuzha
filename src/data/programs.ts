export interface Program {
  id: string;
  title: string;
  /** Malayalam versions entered in the admin; the English is shown when they are missing. */
  titleMl?: string;
  speaker: string;
  speakerMl?: string;
  date: string; // ISO format with time and Asia/Kolkata offset, e.g., '2026-10-04T18:00:00+05:30'
  endTime?: string; // ISO format, e.g., '2026-10-04T20:30:00+05:30'
  venue: string;
  venueMl?: string;
  description: string;
  descriptionMl?: string;
  isOnline: boolean;
  isLive?: boolean;
  /** How people attend: at the venue, through a live stream, or both. */
  format?: "in_person" | "online" | "hybrid";
  /** Optional https link (registration, livestream page). */
  link?: string;
  poster?: {
    url: string;
    width: number;
    height: number;
    blurDataUrl: string;
    alt: string;
  };
}

/**
 * Returns programs sorted chronologically by date.
 */
export function getSortedPrograms(items: Program[]): Program[] {
  return [...items].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
