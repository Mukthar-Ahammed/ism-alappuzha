import type { DhikrItem } from "@/data/dhikr";
import type { MessageActionState } from "@/lib/auth/types";

export const dhikrCacheTag = "published-dhikr";

export const dhikrMigrationFile = "supabase/phase9-dhikr-combined.sql, then supabase/phase12-malayalam-content-combined.sql";

export type AdminDhikr = {
  id: string;
  title: string;
  category: DhikrItem["category"];
  arabic: string;
  transliteration: string | null;
  /** The pronunciation written in Malayalam script. */
  transliterationMl: string | null;
  malayalam: string | null;
  reference: string | null;
  referenceMl: string | null;
  repeatCount: number | null;
  sortOrder: number;
  status: "draft" | "published";
  reviewedBy: string | null;
  reviewedAt: string | null;
};

export type DhikrActionState = MessageActionState;
