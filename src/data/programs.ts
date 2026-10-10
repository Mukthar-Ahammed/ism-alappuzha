export interface Program {
  id: string;
  title: string;
  speaker: string;
  date: string; // ISO format with time and Asia/Kolkata offset, e.g., '2026-10-04T18:00:00+05:30'
  endTime?: string; // ISO format, e.g., '2026-10-04T20:30:00+05:30'
  venue: string;
  description: string;
  isOnline: boolean;
  isLive?: boolean;
}

export const programsData: Program[] = [
  {
    id: "prog-1",
    title: "TODO: District Youth Conclave 2026",
    speaker: "TODO: Dr. Muhammed Abdul Jabbar",
    date: "2026-10-04T18:00:00+05:30",
    endTime: "2026-10-04T20:30:00+05:30",
    venue: "TODO: Town Hall, Alappuzha",
    description:
      "TODO: Annual youth summit addressing contemporary challenges, faith, and ethical leadership in modern society.",
    isOnline: false,
  },
  {
    id: "prog-2",
    title: "TODO: Evening Seerah Study Circle",
    speaker: "TODO: Ustadh Rashid Madani",
    date: "2026-10-04T21:00:00+05:30",
    endTime: "2026-10-04T22:30:00+05:30",
    venue: "TODO: ISM District Center & Online",
    description:
      "TODO: An interactive session exploring practical lessons from prophetic biography for daily youth life.",
    isOnline: true,
  },
  {
    id: "prog-3",
    title: "TODO: Campus Leaders Training Workshop",
    speaker: "TODO: Faisal Salafi",
    date: "2026-10-18T10:00:00+05:30",
    endTime: "2026-10-18T13:00:00+05:30",
    venue: "TODO: Islamic Center Auditorium, Kayamkulam",
    description:
      "TODO: Specialized skill-building workshop for student leaders and campus organizers.",
    isOnline: false,
  },
  {
    id: "prog-4",
    title: "TODO: Winter Quran & Science Seminar",
    speaker: "TODO: Dr. Shamsuddin Karunagappally",
    date: "2026-11-15T16:30:00+05:30",
    endTime: "2026-11-15T19:00:00+05:30",
    venue: "TODO: Public Library Hall, Cherthala",
    description:
      "TODO: Exploring scientific signs in Quranic verses and building an authentic scientific worldview.",
    isOnline: true,
  },
];

/**
 * Returns programs sorted chronologically by date.
 */
export function getSortedPrograms(items: Program[] = programsData): Program[] {
  return [...items].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
