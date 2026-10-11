import "server-only";

import { unstable_cache } from "next/cache";
import { namazSteps as bundledSteps, type PrayerStep } from "@/data/namaz";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingSchema, MissingMigrationError } from "@/lib/supabase/schema-errors";
import { namazCacheTag, namazMigrationFile, type AdminNamazStep } from "@/features/namaz/types";
import { toPrayerSteps } from "@/features/namaz/workflow";

const legacyStepColumns =
  "id,position,name,what_to_do,arabic,transliteration,malayalam,dos,donts,is_repeat_node,status";
const stepColumns = `${legacyStepColumns},name_ml,what_to_do_ml,transliteration_ml,dos_ml,donts_ml`;

type NamazStepRow = {
  id: string;
  position: number;
  name: string;
  what_to_do: string;
  arabic: string;
  transliteration: string | null;
  malayalam: string | null;
  dos: string[] | null;
  donts: string[] | null;
  /** Absent until the Malayalam columns are added. */
  name_ml?: string | null;
  what_to_do_ml?: string | null;
  transliteration_ml?: string | null;
  dos_ml?: string[] | null;
  donts_ml?: string[] | null;
  is_repeat_node: boolean;
  status: AdminNamazStep["status"];
};

function toAdminStep(row: NamazStepRow): AdminNamazStep {
  return {
    id: row.id,
    position: row.position,
    name: row.name,
    nameMl: row.name_ml ?? null,
    whatToDo: row.what_to_do,
    whatToDoMl: row.what_to_do_ml ?? null,
    arabic: row.arabic,
    transliteration: row.transliteration,
    transliterationMl: row.transliteration_ml ?? null,
    malayalam: row.malayalam,
    dos: row.dos ?? [],
    dosMl: row.dos_ml ?? [],
    donts: row.donts ?? [],
    dontsMl: row.donts_ml ?? [],
    isRepeatNode: row.is_repeat_node,
    status: row.status,
  };
}

type NamazStepResult =
  | { data: NamazStepRow[]; error: null }
  | { data: null; error: { code?: string; message: string } };

/** Until the Malayalam columns exist, steps are read without them, so nothing disappears. */
async function selectSteps(
  run: (columns: string) => PromiseLike<NamazStepResult>
): Promise<NamazStepResult> {
  const result = await run(stepColumns);

  return isMissingSchema(result.error) ? run(legacyStepColumns) : result;
}

/** Every step, drafts included, in guide order. */
export async function listAdminNamazSteps(): Promise<AdminNamazStep[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await selectSteps((columns) =>
    supabase
      .from("namaz_steps")
      .select(columns)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(200)
      .overrideTypes<NamazStepRow[], { merge: false }>()
  );

  if (isMissingSchema(error)) {
    throw new MissingMigrationError(namazMigrationFile);
  }

  if (error) {
    throw new Error("Could not load the Namaz steps.");
  }

  return data.map(toAdminStep);
}

async function loadPublishedSteps(): Promise<PrayerStep[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await selectSteps((columns) =>
    supabase
      .from("namaz_steps")
      .select(columns)
      .eq("status", "published")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(200)
      .overrideTypes<NamazStepRow[], { merge: false }>()
  );

  if (error) {
    // Thrown so a failed read is never cached; the caller falls back to the bundled guide.
    throw new Error(isMissingSchema(error) ? "namaz_steps table missing" : "Could not load Namaz steps.");
  }

  return toPrayerSteps(data.map(toAdminStep));
}

const getCachedPublishedSteps = unstable_cache(loadPublishedSteps, ["published-namaz-steps"], {
  tags: [namazCacheTag],
  revalidate: 3600,
});

/**
 * The guide's cards. Once the phase 11 table exists, exactly what is published in the admin
 * (possibly none, which hides the guide). Until then, or if the database cannot be reached,
 * the bundled guide the site has always shown, so the section never disappears by accident.
 */
export async function getPublicNamazSteps(): Promise<PrayerStep[]> {
  try {
    return await getCachedPublishedSteps();
  } catch {
    return bundledSteps;
  }
}
