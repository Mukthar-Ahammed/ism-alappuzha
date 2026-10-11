import "server-only";

import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingSchema, MissingMigrationError } from "@/lib/supabase/schema-errors";
import { mediaPreviewColumns, mediaRowToPreview } from "@/features/media/server/data";
import {
  leadersCacheTag,
  leadersPageSize,
  type AdminLeader,
} from "@/features/leaders/types";
import type { Leader } from "@/lib/types/leader";

const leadersMigrationFile = "supabase/phase6b-images-and-leaders-combined.sql";
const malayalamMigrationFile = "supabase/phase12-malayalam-content-combined.sql";

const baseLeaderColumns = `id,name,role,bio,linkedin_url,instagram_url,status,sort_order,photo:media_assets(${mediaPreviewColumns})`;
const adminLeaderColumns = `${baseLeaderColumns},name_ml,role_ml,bio_ml`;

type AdminLeaderRow = {
  id: string;
  name: string;
  role: string;
  bio: string;
  /** Missing until the Malayalam content SQL has run. */
  name_ml?: string | null;
  role_ml?: string | null;
  bio_ml?: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  status: "draft" | "published";
  sort_order: number;
  photo: Parameters<typeof mediaRowToPreview>[0] | null;
};

/** Names the SQL still to run: the leaders table itself, or only its Malayalam columns. */
async function missingLeadersMigration(): Promise<MissingMigrationError> {
  const base = await createSupabaseAdminClient().from("leaders").select("id").limit(1);

  return new MissingMigrationError(isMissingSchema(base.error) ? leadersMigrationFile : malayalamMigrationFile);
}

function toAdminLeader(row: AdminLeaderRow): AdminLeader {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    bio: row.bio,
    nameMl: row.name_ml ?? null,
    roleMl: row.role_ml ?? null,
    bioMl: row.bio_ml ?? null,
    linkedin: row.linkedin_url,
    instagram: row.instagram_url,
    status: row.status,
    sortOrder: row.sort_order,
    photo: row.photo ? mediaRowToPreview(row.photo) : null,
  };
}

export async function listAdminLeaders(page: number): Promise<{
  leaders: AdminLeader[];
  totalPages: number;
  firstId: string | null;
  lastId: string | null;
}> {
  const supabase = createSupabaseAdminClient();
  const from = (page - 1) * leadersPageSize;
  const [list, first, last] = await Promise.all([
    supabase
      .from("leaders")
      .select(adminLeaderColumns, { count: "exact" })
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + leadersPageSize - 1)
      .overrideTypes<AdminLeaderRow[], { merge: false }>(),
    supabase.from("leaders").select("id").order("sort_order").order("id").limit(1).maybeSingle(),
    supabase
      .from("leaders")
      .select("id")
      .order("sort_order", { ascending: false })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (isMissingSchema(list.error)) {
    throw await missingLeadersMigration();
  }

  if (list.error) {
    throw new Error("Could not load leaders.");
  }

  return {
    leaders: list.data.map(toAdminLeader),
    totalPages: Math.max(1, Math.ceil((list.count ?? 0) / leadersPageSize)),
    firstId: first.data?.id ?? null,
    lastId: last.data?.id ?? null,
  };
}

export async function getAdminLeader(id: string): Promise<AdminLeader | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("leaders")
    .select(adminLeaderColumns)
    .eq("id", id)
    .overrideTypes<AdminLeaderRow[], { merge: false }>();

  if (isMissingSchema(error)) {
    throw await missingLeadersMigration();
  }

  if (error) {
    throw new Error("Could not load this leader.");
  }

  const row = data[0];

  return row ? toAdminLeader(row) : null;
}

export function adminLeaderToPublic(leader: AdminLeader): Leader {
  return {
    id: leader.id,
    name: leader.name,
    role: leader.role,
    bio: leader.bio,
    nameMl: leader.nameMl ?? undefined,
    roleMl: leader.roleMl ?? undefined,
    bioMl: leader.bioMl ?? undefined,
    photo: leader.photo?.url ?? null,
    photoAlt: leader.photo?.alt || undefined,
    photoBlurDataUrl: leader.photo?.blurDataUrl,
    linkedin: leader.linkedin ?? undefined,
    instagram: leader.instagram ?? undefined,
  };
}

async function loadPublishedLeaders(): Promise<Leader[]> {
  const supabase = createSupabaseAdminClient();
  const read = (columns: string) =>
    supabase
      .from("leaders")
      .select(columns)
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true })
      .limit(50)
      .overrideTypes<AdminLeaderRow[], { merge: false }>();
  let { data, error } = await read(adminLeaderColumns);

  // Before the Malayalam columns exist, the English ones still show.
  if (isMissingSchema(error)) {
    ({ data, error } = await read(baseLeaderColumns));
  }

  if (error || !data) {
    // Thrown so a failed read is never cached as "no leaders".
    throw new Error("Could not load published leaders.");
  }

  return data.map((row) => adminLeaderToPublic(toAdminLeader(row)));
}

const getCachedPublishedLeaders = unstable_cache(loadPublishedLeaders, ["published-leaders"], {
  tags: [leadersCacheTag],
  revalidate: 3600,
});

/** Only leaders published in the admin appear; there is no placeholder fallback. */
export async function getPublicLeaders(): Promise<Leader[]> {
  try {
    return await getCachedPublishedLeaders();
  } catch {
    return [];
  }
}
