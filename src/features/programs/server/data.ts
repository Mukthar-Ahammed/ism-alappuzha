import "server-only";

import { unstable_cache } from "next/cache";
import type { Program } from "@/data/programs";
import { programHomepageWindowMs } from "@/lib/programs/schedule";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingSchema, MissingMigrationError } from "@/lib/supabase/schema-errors";
import { mediaPreviewColumns, mediaRowToPreview } from "@/features/media/server/data";
import type { ProgramTab } from "@/features/programs/schemas";
import {
  programsCacheTag,
  programsPageSize,
  type AdminProgram,
} from "@/features/programs/types";

// Phase 7 builds on the Phase 6B media tables, so both files are listed in order.
const programsMigrationFile =
  "supabase/phase6b-images-and-leaders-combined.sql, then supabase/phase7-live-and-programs-combined.sql, then supabase/phase12-malayalam-content-combined.sql";

const baseProgramColumns = `id,title,speaker,starts_at,ends_at,format,venue,description,link_url,status,poster:media_assets(${mediaPreviewColumns})`;
const programColumns = `${baseProgramColumns},title_ml,speaker_ml,venue_ml,description_ml`;

// The public calendar shows recent past programs as well as upcoming ones.
const publicHistoryMs = 60 * 24 * 60 * 60 * 1000;

type ProgramRow = {
  id: string;
  title: string;
  speaker: string | null;
  starts_at: string;
  ends_at: string | null;
  format: "in_person" | "online" | "hybrid";
  venue: string | null;
  description: string | null;
  link_url: string | null;
  status: "scheduled" | "cancelled";
  // Absent until the phase 12 SQL has run.
  title_ml?: string | null;
  speaker_ml?: string | null;
  venue_ml?: string | null;
  description_ml?: string | null;
  poster: Parameters<typeof mediaRowToPreview>[0] | null;
};

function toAdminProgram(row: ProgramRow): AdminProgram {
  return {
    id: row.id,
    title: row.title,
    speaker: row.speaker ?? "",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    format: row.format,
    venue: row.venue ?? "",
    description: row.description,
    link: row.link_url,
    status: row.status,
    poster: row.poster ? mediaRowToPreview(row.poster) : null,
    titleMl: row.title_ml ?? null,
    speakerMl: row.speaker_ml ?? null,
    venueMl: row.venue_ml ?? null,
    descriptionMl: row.description_ml ?? null,
  };
}

export function adminProgramToPublic(program: AdminProgram): Program {
  return {
    id: program.id,
    title: program.title,
    titleMl: program.titleMl ?? undefined,
    speaker: program.speaker,
    speakerMl: program.speakerMl ?? undefined,
    date: program.startsAt,
    endTime: program.endsAt ?? undefined,
    venue: program.format === "online" ? "Online" : program.venue,
    venueMl: program.format === "online" ? "ഓൺലൈൻ" : (program.venueMl ?? undefined),
    description: program.description ?? "",
    descriptionMl: program.descriptionMl ?? undefined,
    isOnline: program.format !== "in_person",
    format: program.format,
    link: program.link ?? undefined,
    poster: program.poster
      ? {
          url: program.poster.url,
          width: program.poster.width,
          height: program.poster.height,
          blurDataUrl: program.poster.blurDataUrl,
          alt: program.poster.alt,
        }
      : undefined,
  };
}

export async function listAdminPrograms(
  tab: ProgramTab,
  page: number,
  now: Date
): Promise<{ programs: AdminProgram[]; totalPages: number }> {
  const boundary = new Date(now.getTime() - programHomepageWindowMs).toISOString();
  const from = (page - 1) * programsPageSize;
  const supabase = createSupabaseAdminClient();
  const query = supabase.from("programs").select(programColumns, { count: "exact" });
  const filtered =
    tab === "upcoming"
      ? query.gt("starts_at", boundary).order("starts_at", { ascending: true })
      : query.lte("starts_at", boundary).order("starts_at", { ascending: false });
  const { data, error, count } = await filtered
    .range(from, from + programsPageSize - 1)
    .overrideTypes<ProgramRow[], { merge: false }>();

  if (isMissingSchema(error)) {
    throw new MissingMigrationError(programsMigrationFile);
  }

  if (error) {
    throw new Error("Could not load programs.");
  }

  return {
    programs: data.map(toAdminProgram),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / programsPageSize)),
  };
}

export async function getAdminProgram(id: string): Promise<AdminProgram | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("programs")
    .select(programColumns)
    .eq("id", id)
    .overrideTypes<ProgramRow[], { merge: false }>();

  if (isMissingSchema(error)) {
    throw new MissingMigrationError(programsMigrationFile);
  }

  if (error) {
    throw new Error("Could not load this program.");
  }

  const row = data[0];

  return row ? toAdminProgram(row) : null;
}

async function loadPublicPrograms(): Promise<Program[]> {
  const supabase = createSupabaseAdminClient();
  const since = new Date(Date.now() - publicHistoryMs).toISOString();
  const read = (columns: string) =>
    supabase
      .from("programs")
      .select(columns)
      .eq("status", "scheduled")
      .gte("starts_at", since)
      .order("starts_at", { ascending: true })
      .limit(100)
      .overrideTypes<ProgramRow[], { merge: false }>();
  let { data, error } = await read(programColumns);

  // Before the Malayalam columns exist, the site keeps showing the English text.
  if (isMissingSchema(error)) {
    ({ data, error } = await read(baseProgramColumns));
  }

  if (error) {
    // Thrown so a failed read is never cached as "no programs".
    throw new Error("Could not load programs.");
  }

  return (data ?? []).map((row) => adminProgramToPublic(toAdminProgram(row)));
}

const getCachedPublicPrograms = unstable_cache(loadPublicPrograms, ["public-programs"], {
  tags: [programsCacheTag],
  revalidate: 3600,
});

/** Only programs added in the admin appear; there is no placeholder fallback. */
export async function getPublicPrograms(): Promise<Program[]> {
  try {
    return await getCachedPublicPrograms();
  } catch {
    return [];
  }
}
