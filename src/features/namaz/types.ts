import type { MessageActionState } from "@/lib/auth/types";

export const namazCacheTag = "published-namaz-steps";

export const namazMigrationFile = "supabase/phase11-namaz-combined.sql, then supabase/phase12-malayalam-content-combined.sql";

/** Most "Do" or "Don't" lines one card can hold (also a database check). */
export const maxGuidanceItems = 8;

export type AdminNamazStep = {
  id: string;
  position: number;
  name: string;
  nameMl: string | null;
  whatToDo: string;
  whatToDoMl: string | null;
  arabic: string;
  transliteration: string | null;
  /** The pronunciation written in Malayalam script. */
  transliterationMl: string | null;
  malayalam: string | null;
  dos: string[];
  dosMl: string[];
  donts: string[];
  dontsMl: string[];
  isRepeatNode: boolean;
  status: "draft" | "published";
};

export type NamazActionState = MessageActionState;
