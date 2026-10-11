import "server-only";

import { unstable_cache } from "next/cache";
import type { DhikrItem } from "@/data/dhikr";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingSchema, MissingMigrationError } from "@/lib/supabase/schema-errors";
import { dhikrCacheTag, dhikrMigrationFile, type AdminDhikr } from "@/features/dhikr/types";
import { adminDhikrToPublic, sortDhikr } from "@/features/dhikr/workflow";

const legacyDhikrColumns =
  "id,title,category,arabic,transliteration,malayalam,reference,repeat_count,sort_order,status,reviewed_by,reviewed_at";
const dhikrColumns = `${legacyDhikrColumns},transliteration_ml,reference_ml`;

type DhikrRow = {
  id: string;
  title: string;
  category: AdminDhikr["category"];
  arabic: string;
  transliteration: string | null;
  malayalam: string | null;
  reference: string | null;
  /** Absent until the Malayalam columns are added. */
  transliteration_ml?: string | null;
  reference_ml?: string | null;
  repeat_count: number | string | null;
  sort_order: number;
  status: AdminDhikr["status"];
  reviewed_by: string | null;
  reviewed_at: string | null;
};

/** Before the phase 9 SQL, repeat_count is still text; anything not numeric is ignored. */
function toRepeatCount(value: DhikrRow["repeat_count"]): number | null {
  const count = typeof value === "string" ? Number.parseInt(value, 10) : value;

  return typeof count === "number" && Number.isInteger(count) && count > 0 ? count : null;
}

function toAdminDhikr(row: DhikrRow): AdminDhikr {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    arabic: row.arabic,
    transliteration: row.transliteration,
    transliterationMl: row.transliteration_ml ?? null,
    malayalam: row.malayalam,
    reference: row.reference,
    referenceMl: row.reference_ml ?? null,
    repeatCount: toRepeatCount(row.repeat_count),
    sortOrder: row.sort_order,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
  };
}

type DhikrResult =
  | { data: DhikrRow[]; error: null }
  | { data: null; error: { code?: string; message: string } };

/** Until the Malayalam columns exist, entries are read without them, so nothing disappears. */
async function selectDhikr(run: (columns: string) => PromiseLike<DhikrResult>): Promise<DhikrResult> {
  const result = await run(dhikrColumns);

  return isMissingSchema(result.error) ? run(legacyDhikrColumns) : result;
}

/**
 * The table predates phase 9, so reading it does not prove the admin functions exist.
 * An invalid direction is refused by admin_move_dhikr before it touches anything.
 */
export async function assertDhikrFunctionsInstalled(): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc("admin_move_dhikr", {
    p_id: "00000000-0000-4000-8000-000000000000",
    p_direction: "setup-check" as "up",
    p_actor_email: "setup-check",
  });

  if (isMissingSchema(error)) {
    throw new MissingMigrationError(dhikrMigrationFile);
  }
}

/** Every entry, drafts included, in website order. The library is small enough to list whole. */
export async function listAdminDhikr(): Promise<AdminDhikr[]> {
  await assertDhikrFunctionsInstalled();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await selectDhikr((columns) =>
    supabase
      .from("dhikr_entries")
      .select(columns)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1000)
      .overrideTypes<DhikrRow[], { merge: false }>()
  );

  if (isMissingSchema(error)) {
    throw new MissingMigrationError(dhikrMigrationFile);
  }

  if (error) {
    throw new Error("Could not load dhikr.");
  }

  return sortDhikr(data.map(toAdminDhikr));
}

export async function getAdminDhikr(id: string): Promise<AdminDhikr | null> {
  await assertDhikrFunctionsInstalled();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await selectDhikr((columns) =>
    supabase
      .from("dhikr_entries")
      .select(columns)
      .eq("id", id)
      .overrideTypes<DhikrRow[], { merge: false }>()
  );

  if (isMissingSchema(error)) {
    throw new MissingMigrationError(dhikrMigrationFile);
  }

  if (error) {
    throw new Error("Could not load this entry.");
  }

  const row = data[0];

  return row ? toAdminDhikr(row) : null;
}

async function loadPublishedDhikr(): Promise<DhikrItem[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await selectDhikr((columns) =>
    supabase
      .from("dhikr_entries")
      .select(columns)
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1000)
      .overrideTypes<DhikrRow[], { merge: false }>()
  );

  if (error) {
    // Thrown so a failed read is never cached as "no dhikr".
    throw new Error("Could not load dhikr.");
  }

  return sortDhikr(data.map(toAdminDhikr)).map(adminDhikrToPublic);
}

const getCachedPublishedDhikr = unstable_cache(loadPublishedDhikr, ["published-dhikr"], {
  tags: [dhikrCacheTag],
  revalidate: 3600,
});

/** Only entries checked and published in the admin appear; there is no placeholder fallback. */
export async function getPublicDhikr(): Promise<DhikrItem[]> {
  try {
    return await getCachedPublishedDhikr();
  } catch {
    return [];
  }
}
