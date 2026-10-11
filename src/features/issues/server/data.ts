import "server-only";

import { unstable_cache } from "next/cache";
import type { Issue } from "@/data/issues";
import { publicPdfUrl } from "@/lib/images/storage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMissingSchema, MissingMigrationError } from "@/lib/supabase/schema-errors";
import { mediaPreviewColumns, mediaRowToPreview } from "@/features/media/server/data";
import { issuesCacheTag, issuesPageSize, type AdminIssue } from "@/features/issues/types";
import { issueMonthYear } from "@/features/issues/workflow";

const issuesMigrationFile =
  "supabase/phase8-issues-combined.sql, then supabase/phase12-malayalam-content-combined.sql";

const baseIssueColumns = `id,title,issue_date,description,status,is_featured,pdf_path,pdf_bytes,cover:media_assets(${mediaPreviewColumns})`;
const issueColumns = `${baseIssueColumns},title_ml,description_ml`;

type IssueRow = {
  id: string;
  title: string;
  issue_date: string;
  description: string | null;
  status: AdminIssue["status"];
  is_featured: boolean;
  pdf_path: string;
  pdf_bytes: number | null;
  // Absent until the phase 12 SQL has run.
  title_ml?: string | null;
  description_ml?: string | null;
  cover: Parameters<typeof mediaRowToPreview>[0] | null;
};

function toAdminIssue(row: IssueRow): AdminIssue {
  return {
    id: row.id,
    title: row.title,
    issueDate: row.issue_date,
    description: row.description,
    status: row.status,
    isFeatured: row.is_featured,
    cover: row.cover ? mediaRowToPreview(row.cover) : null,
    pdf: { path: row.pdf_path, url: publicPdfUrl(row.pdf_path), bytes: row.pdf_bytes ?? 0 },
    titleMl: row.title_ml ?? null,
    descriptionMl: row.description_ml ?? null,
  };
}

export function adminIssueToPublic(issue: AdminIssue): Issue {
  return {
    id: issue.id,
    title: issue.title,
    titleMl: issue.titleMl ?? undefined,
    ...issueMonthYear(issue.issueDate),
    summary: issue.description ?? "",
    summaryMl: issue.descriptionMl ?? undefined,
    coverImage: issue.cover?.url,
    coverBlurDataUrl: issue.cover?.blurDataUrl,
    coverAlt: issue.cover?.alt || undefined,
    pdfUrl: issue.pdf.url,
    isFeatured: issue.isFeatured,
  };
}

export async function listAdminIssues(
  page: number
): Promise<{ issues: AdminIssue[]; totalPages: number }> {
  const supabase = createSupabaseAdminClient();
  const from = (page - 1) * issuesPageSize;
  const { data, error, count } = await supabase
    .from("issues")
    .select(issueColumns, { count: "exact" })
    .order("issue_date", { ascending: false })
    .order("id", { ascending: true })
    .range(from, from + issuesPageSize - 1)
    .overrideTypes<IssueRow[], { merge: false }>();

  if (isMissingSchema(error)) {
    throw new MissingMigrationError(issuesMigrationFile);
  }

  if (error) {
    throw new Error("Could not load issues.");
  }

  return {
    issues: data.map(toAdminIssue),
    totalPages: Math.max(1, Math.ceil((count ?? 0) / issuesPageSize)),
  };
}

export async function getAdminIssue(id: string): Promise<AdminIssue | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("issues")
    .select(issueColumns)
    .eq("id", id)
    .overrideTypes<IssueRow[], { merge: false }>();

  if (isMissingSchema(error)) {
    throw new MissingMigrationError(issuesMigrationFile);
  }

  if (error) {
    throw new Error("Could not load this issue.");
  }

  const row = data[0];

  return row ? toAdminIssue(row) : null;
}

async function loadPublishedIssues(): Promise<Issue[]> {
  const supabase = createSupabaseAdminClient();
  const read = (columns: string) =>
    supabase
      .from("issues")
      .select(columns)
      .eq("status", "published")
      .order("issue_date", { ascending: false })
      .limit(25)
      .overrideTypes<IssueRow[], { merge: false }>();
  let { data, error } = await read(issueColumns);

  // Before the Malayalam columns exist, the site keeps showing the English text.
  if (isMissingSchema(error)) {
    ({ data, error } = await read(baseIssueColumns));
  }

  if (error) {
    // Thrown so a failed read is never cached as "no issues".
    throw new Error("Could not load issues.");
  }

  return (data ?? []).map((row) => adminIssueToPublic(toAdminIssue(row)));
}

const getCachedPublishedIssues = unstable_cache(loadPublishedIssues, ["published-issues"], {
  tags: [issuesCacheTag],
  revalidate: 3600,
});

/** Only issues published in the admin appear; there is no placeholder fallback. */
export async function getPublicIssues(): Promise<Issue[]> {
  try {
    return await getCachedPublishedIssues();
  } catch {
    return [];
  }
}
