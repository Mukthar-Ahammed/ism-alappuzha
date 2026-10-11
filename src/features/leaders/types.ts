import type { MediaPreview } from "@/features/media/types";
import type { MessageActionState } from "@/lib/auth/types";

export const leadersCacheTag = "published-leaders";

export const leadersPageSize = 25;

export type LeaderStatus = "draft" | "published";

export type AdminLeader = {
  id: string;
  name: string;
  role: string;
  bio: string;
  /** Malayalam versions; null shows the English. */
  nameMl: string | null;
  roleMl: string | null;
  bioMl: string | null;
  linkedin: string | null;
  instagram: string | null;
  status: LeaderStatus;
  sortOrder: number;
  photo: MediaPreview | null;
};

/** null is the "nothing submitted yet" state for useActionState. */
export type LeaderActionState = MessageActionState;
