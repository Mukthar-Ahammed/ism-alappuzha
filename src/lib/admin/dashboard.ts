import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminDashboardCounts = {
  questions: {
    pending: number;
    draft: number;
    answered: number;
    archived: number;
    published: number;
  };
  issues: number;
  live: number;
  programs: number;
  dhikr: number;
};

async function countRows(
  table:
    | "questions"
    | "issues"
    | "live_status"
    | "programs"
    | "dhikr_entries",
  filters: Record<string, string | boolean> = {}
): Promise<number> {
  const supabase = createSupabaseAdminClient();
  let query = supabase.from(table).select("id", {
    count: "exact",
    head: true,
  });

  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value);
  }

  const { count, error } = await query;

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function getAdminDashboardCounts(): Promise<AdminDashboardCounts> {
  const [
    pending,
    draft,
    answered,
    archived,
    published,
    issues,
    live,
    programs,
    dhikr,
  ] = await Promise.all([
    countRows("questions", { status: "pending" }),
    countRows("questions", { status: "draft" }),
    countRows("questions", { status: "answered" }),
    countRows("questions", { status: "archived" }),
    countRows("questions", { is_published: true }),
    countRows("issues", { status: "published" }),
    countRows("live_status", { is_live: true }),
    countRows("programs", { status: "scheduled" }),
    countRows("dhikr_entries", { status: "published" }),
  ]);

  return {
    questions: {
      pending,
      draft,
      answered,
      archived,
      published,
    },
    issues,
    live,
    programs,
    dhikr,
  };
}
