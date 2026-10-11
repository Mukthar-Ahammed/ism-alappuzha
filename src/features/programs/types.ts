import type { MediaPreview } from "@/features/media/types";
import type { MessageActionState } from "@/lib/auth/types";
import type { ProgramFormat } from "@/features/programs/schemas";

export const programsCacheTag = "public-programs";

export const programsPageSize = 25;

export type AdminProgram = {
  id: string;
  title: string;
  speaker: string;
  startsAt: string;
  endsAt: string | null;
  format: ProgramFormat;
  venue: string;
  description: string | null;
  link: string | null;
  status: "scheduled" | "cancelled";
  poster: MediaPreview | null;
  titleMl: string | null;
  speakerMl: string | null;
  venueMl: string | null;
  descriptionMl: string | null;
};

export type ProgramActionState = MessageActionState;
