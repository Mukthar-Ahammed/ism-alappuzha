import "server-only";

import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AuditLogRow,
  QuestionCategory,
  QuestionListItem,
  QuestionRow,
  QuestionStatus,
  QuestionStatusCounts,
} from "@/features/questions/types";
import type { QuestionFilters } from "@/features/questions/schemas";

export const QUESTIONS_PAGE_SIZE = 25;

const emptyCounts: QuestionStatusCounts = {
  pending: 0,
  draft: 0,
  answered: 0,
  archived: 0,
};

export type QuestionInboxData = {
  items: QuestionListItem[];
  counts: QuestionStatusCounts;
  totalCount: number;
  totalPages: number;
};

export async function listQuestions(
  filters: QuestionFilters
): Promise<QuestionInboxData> {
  const supabase = createSupabaseAdminClient();
  const offset = (filters.page - 1) * QUESTIONS_PAGE_SIZE;
  const search = filters.search?.toUpperCase().startsWith("ISM-")
    ? filters.search.toUpperCase()
    : filters.search;

  const [listResult, countsResult] = await Promise.all([
    supabase.rpc("admin_list_questions", {
      p_status: filters.status,
      p_category: filters.category ?? null,
      p_private_only: filters.private,
      p_published_only: filters.published,
      p_has_email: filters.hasEmail,
      p_search: search,
      p_sort: filters.sort,
      p_limit: QUESTIONS_PAGE_SIZE,
      p_offset: offset,
    }),
    supabase.rpc("admin_question_status_counts", {
      p_category: filters.category ?? null,
      p_private_only: filters.private,
      p_published_only: filters.published,
      p_has_email: filters.hasEmail,
      p_search: search,
    }),
  ]);

  if (listResult.error || countsResult.error) {
    return {
      items: [],
      counts: emptyCounts,
      totalCount: 0,
      totalPages: 1,
    };
  }

  const rows = listResult.data;
  const counts = { ...emptyCounts };

  for (const item of countsResult.data) {
    if (isQuestionStatus(item.status)) {
      counts[item.status] = item.count;
    }
  }

  const totalCount = rows[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / QUESTIONS_PAGE_SIZE));
  const items = rows.flatMap((row) => {
    if (!isQuestionStatus(row.status) || !isQuestionCategory(row.category)) {
      return [];
    }

    return [
      {
        id: row.id,
        ticket_id: row.ticket_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        category: row.category,
        question: row.question,
        status: row.status,
        is_private: row.is_private,
        is_published: row.is_published,
        email: row.email,
      },
    ];
  });

  return {
    items,
    counts,
    totalCount,
    totalPages,
  };
}

export async function getQuestionDetail(id: string): Promise<{
  question: QuestionRow;
  timeline: AuditLogRow[];
}> {
  const supabase = createSupabaseAdminClient();
  const [questionResult, timelineResult] = await Promise.all([
    supabase
      .from("questions")
      .select(
        "id,ticket_id,created_at,updated_at,name,email,category,question,draft_answer,answer,answered_by,answered_at,status,needs_review,internal_notes,archive_reason,public_question,is_private,is_published,published_at"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("audit_log")
      .select("id,question_id,ticket_id,actor_email,action,detail,entity,entity_id,created_at")
      .eq("entity", "question")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (questionResult.error || !questionResult.data) {
    notFound();
  }

  return {
    question: questionResult.data,
    timeline: timelineResult.error ? [] : timelineResult.data,
  };
}

function isQuestionStatus(value: string): value is QuestionStatus {
  return ["pending", "draft", "answered", "archived"].includes(value);
}

function isQuestionCategory(value: string): value is QuestionCategory {
  return ["Prayer", "Faith", "Daily life", "Family", "Other"].includes(value);
}
